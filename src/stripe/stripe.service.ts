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

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,

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
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('No items provided');
    }

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

      line_items.push({
        price_data: {
          currency: 'cop',
          product_data: {
            name: product.title,
            metadata: {
              productId: String(product.id),
            },
          },
          unit_amount: Number(product.price) * 100,
        },
        quantity: item.quantity,
      });
    }

    const frontUrl = this.configService.getOrThrow<string>('FRONT_URL');

    const origin = req.headers.origin || 'http://localhost:3000/';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        userId,
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
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

      // 🔐 Validar que realmente esté pagado
      if (session.payment_status !== 'paid') return;

      const userId = session.metadata?.userId;
      if (!userId) return;

      // 🚫 Evitar duplicados
      const existingOrder = await this.orderRepository.findOne({
        where: { stripeSessionId: session.id },
      });

      if (existingOrder) return;
      await this.dataSource.transaction(async (manager) => {
        // 1️⃣ Buscar carrito del usuario
        const cart = await manager.findOne(Cart, {
          where: { user: { id: userId } },
          relations: ['cartItems', 'cartItems.product'],
        });

        if (!cart || !cart.cartItems.length) {
          throw new Error('Cart is empty');
        }

        // 2️⃣ Validar stock
        for (const item of cart.cartItems) {
          if (item.quantity > item.product.stock) {
            throw new Error(
              `Not enough stock for product ${item.product.title}`,
            );
          }
        }

        // 3️⃣ Generar tracking
        const trackingCode =
          'TRK-' + randomBytes(4).toString('hex').toUpperCase();

        // 4️⃣ Crear orden
        const order = manager.create(Order, {
          user: { id: userId } as any,
          stripeSessionId: session.id,
          total: (session.amount_total ?? 0) / 100,
          trackingCode: trackingCode,
          status: OrderStatus.PAID,
        });

        await manager.save(order);

        // 5️⃣ Crear OrderItems y descontar stock
        for (const item of cart.cartItems) {
          const subtotal = item.quantity * Number(item.priceAtMoment);

          await manager.save(
            manager.create(OrderItem, {
              order,
              product: item.product,
              quantity: item.quantity,
              title: item.product.title,
              unitPrice: item.priceAtMoment,
              subtotal: subtotal,
            }),
          );

          // descontar stock
          item.product.stock -= item.quantity;
          await manager.save(item.product);
        }

        // 6️⃣ Limpiar carrito
        await manager.delete(CartItem, {
          cart: { id: cart.id },
        });
      });
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
