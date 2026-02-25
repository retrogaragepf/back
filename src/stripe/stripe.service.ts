import Stripe from 'stripe';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/products.entity';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { CartItem } from 'src/cartItem/entities/cartItem.entity';
import { Request } from 'express';
import { Cart } from 'src/carts/entities/cart.entity';
import { randomBytes } from 'crypto';
import { DiscountService } from 'src/discountCode/discountCode.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private discountService: DiscountService,
    private readonly emailService: EmailService,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    private readonly dataSource: DataSource,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    });
  }

  get client() {
    return this.stripe;
  }

  async createCheckoutSession(
    userId: string,
    items: { productId: string; quantity: number }[],
    req: Request,
    discountCode?: string,
  ) {
    console.log('--- INICIO createCheckoutSession ---');
    console.log('User:', userId);
    console.log('DiscountCode recibido:', discountCode);

    if (!items || items.length === 0) {
      throw new BadRequestException('No items provided');
    }

    let subtotal = 0;
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new BadRequestException('Invalid quantity');
      }

      const product = await this.productsRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      if (item.quantity > product.stock) {
        throw new BadRequestException('Not enough stock');
      }

      const unitPrice = Number(product.price);
      subtotal += unitPrice * item.quantity;

      line_items.push({
        price_data: {
          currency: 'cop',
          product_data: {
            name: product.title,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantity,
      });
    }

    console.log('Subtotal calculado:', subtotal);

    let discountPercentage = 0;
    let stripeCouponId: string | undefined;

    if (discountCode) {
      const discount = await this.discountService.validateCode(discountCode);

      console.log('Discount encontrado en DB:', discount);

      discountPercentage = Number(discount.percentage);

      console.log('Porcentaje aplicado:', discountPercentage);

      if (!Number.isFinite(discountPercentage) || discountPercentage <= 0) {
        throw new BadRequestException('Invalid discount percentage');
      }

      const stripeCoupon = await this.stripe.coupons.create({
        percent_off: discountPercentage,
        duration: 'once',
      });

      stripeCouponId = stripeCoupon.id;

      console.log('Stripe coupon creado:', stripeCoupon);
      console.log('Stripe coupon ID:', stripeCouponId);
    }

    const discountAmount = subtotal * (discountPercentage / 100);
    const finalTotal = subtotal - discountAmount;

    console.log('DiscountAmount:', discountAmount);
    console.log('FinalTotal:', finalTotal);

    if (typeof finalTotal !== 'number' || isNaN(finalTotal) || finalTotal < 1) {
      throw new BadRequestException('El total debe ser mayor o igual a 1');
    }

    const origin = req.headers.origin || 'http://localhost:3000';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        userId,
        discountCode: discountCode ?? '',
        discountPercentage: discountPercentage.toString(),
        subtotal: subtotal.toString(),
        finalTotal: finalTotal.toString(),
      },
    };

    console.log('SESSION PARAMS ENVIADOS A STRIPE:', sessionParams);

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    console.log('Stripe session creada:', session.id);
    console.log('--- FIN createCheckoutSession ---');

    return {
      url: session.url,
      sessionId: session.id,
      code: discountCode ?? '',
      percentage: discountPercentage,
      discountAmount,
      finalTotal,
    };
  }

  async handleWebhook(req: Request & { body: Buffer }, signature: string) {
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException('Invalid signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== 'paid') return;

      const userId = session.metadata?.userId;
      if (!userId) return;

      const existingOrder = await this.orderRepository.findOne({
        where: { stripeSessionId: session.id },
      });

      if (existingOrder) return;

      const purchaseEmailPayload = await this.dataSource.transaction(async (manager) => {
        const cart = await manager.findOne(Cart, {
          where: { user: { id: userId } },
          relations: ['user', 'cartItems', 'cartItems.product'],
        });

        if (!cart || !cart.cartItems.length) {
          throw new Error('Cart is empty');
        }

        let subtotal = 0;

        for (const item of cart.cartItems) {
          if (item.quantity > item.product.stock) {
            throw new Error(`Not enough stock for ${item.product.title}`);
          }

          subtotal += item.quantity * Number(item.priceAtMoment);
        }

        const discountCode = session.metadata?.discountCode;
        let discountPercentage = Number(
          session.metadata?.discountPercentage || 0,
        );

        let discountAmount = 0;

        if (discountCode && discountPercentage > 0) {
          discountAmount = subtotal * (discountPercentage / 100);

          await this.discountService.markAsUsed(discountCode, userId, manager);
        }

        const finalTotal = subtotal - discountAmount;

        const trackingCode =
          'TRK-' + randomBytes(4).toString('hex').toUpperCase();

        const order = manager.create(Order, {
          user: { id: userId } as any,
          stripeSessionId: session.id,
          total: finalTotal,
          trackingCode,
          status: OrderStatus.PAID,
        });

        await manager.save(order);

        const emailItems: Array<{
          title: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
        }> = [];

        for (const item of cart.cartItems) {
          const subtotalItem = item.quantity * Number(item.priceAtMoment);

          await manager.save(
            manager.create(OrderItem, {
              order,
              product: item.product,
              quantity: item.quantity,
              title: item.product.title,
              unitPrice: item.priceAtMoment,
              subtotal: subtotalItem,
            }),
          );

          emailItems.push({
            title: item.product.title,
            quantity: item.quantity,
            unitPrice: Number(item.priceAtMoment),
            subtotal: subtotalItem,
          });

          item.product.stock -= item.quantity;
          await manager.save(item.product);
        }

        await manager.delete(CartItem, {
          cart: { id: cart.id },
        });

        if (cart.user?.email) {
          return {
            to: cart.user.email,
            name: cart.user.name || 'usuario',
            orderId: order.id,
            total: Number(order.total),
            trackingCode: order.trackingCode,
            items: emailItems,
          };
        }

        return null;
      });

      if (purchaseEmailPayload) {
        try {
          await this.emailService.sendPurchaseConfirmationEmail(
            purchaseEmailPayload.to,
            purchaseEmailPayload.name,
            purchaseEmailPayload.orderId,
            purchaseEmailPayload.total,
            purchaseEmailPayload.trackingCode,
            purchaseEmailPayload.items,
          );
        } catch (error) {
          console.error('Error sending purchase confirmation email:', error);
        }
      }
    }

    return { received: true };
  }

  async getSession(sessionId: string) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    return {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency,
    };
  }
}
