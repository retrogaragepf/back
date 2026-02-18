import Stripe from 'stripe';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/products.entity';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { CartItem } from 'src/cartItem/entities/cartItem.entity';
import { Request } from 'express';

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

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${process.env.FRONT_URL}/success`,
      cancel_url: `${process.env.FRONT_URL}/cancel`,
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

      const userId = session.metadata?.userId;
      if (!userId) return;

      const existingOrder = await this.orderRepository.findOne({
        where: { stripeSessionId: session.id },
      });

      if (existingOrder) return;

      await this.dataSource.transaction(async (manager) => {
        const lineItems = await this.stripe.checkout.sessions.listLineItems(
          session.id,
          {
            expand: ['data.price.product'],
          },
        );

        const order = manager.create(Order, {
          user: { id: userId },
          stripeSessionId: session.id,
          total: (session.amount_total ?? 0) / 100,
        });

        await manager.save(order);

        for (const item of lineItems.data) {
          const stripeProduct = item.price?.product as Stripe.Product;

          const productId = stripeProduct?.metadata?.productId;

          if (!productId) {
            throw new Error('Missing productId in Stripe metadata');
          }

          const product = await manager.findOne(Product, {
            where: { id: productId },
          });

          if (!product) {
            throw new Error(`Product not found with id ${productId}`);
          }

          await manager.save(
            manager.create(OrderItem, {
              order,
              product,
              quantity: item.quantity ?? 0,
              price: (item.amount_total ?? 0) / 100,
            }),
          );

          product.stock -= item.quantity ?? 0;
          await manager.save(product);
        }

        await manager.delete(CartItem, {
          cart: { user: { id: userId } },
        });
      });
    }

    return { received: true };
  }
}
