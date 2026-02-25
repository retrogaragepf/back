import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification-type.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getAllOrders() {
    return this.orderRepository.find({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async dispatchOrder(orderId: string, sellerId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product', 'items.product.user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be PAID to dispatch');
    }

    const isSeller = order.items.every((item) => item.product.user.id === sellerId);
    if (!isSeller) {
      throw new ForbiddenException('You are not the seller of this order');
    }

    order.status = OrderStatus.SHIPPED;
    const savedOrder = await this.orderRepository.save(order);

    try {
      await this.notificationsService.createNotification(
        order.user.id,
        NotificationType.ORDER_SHIPPED,
        `Tu pedido ${order.id} fue marcado como enviado.`,
      );
    } catch (error) {
      console.error('Error creating shipped notification:', error);
    }

    return savedOrder;
  }

  async receiveOrder(orderId: string, buyerId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product', 'items.product.user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(
        'Order must be SHIPPED to confirm delivery',
      );
    }

    if (order.user.id !== buyerId) {
      throw new ForbiddenException('You are not the buyer of this order');
    }

    order.status = OrderStatus.DELIVERED;
    const savedOrder = await this.orderRepository.save(order);

    const sellerIds = Array.from(
      new Set(
        order.items
          .map((item) => item.product.user?.id)
          .filter((id): id is string => Boolean(id && id !== buyerId)),
      ),
    );

    try {
      await Promise.all([
        this.notificationsService.createNotification(
          buyerId,
          NotificationType.ORDER_DELIVERED,
          `Tu pedido ${order.id} fue marcado como entregado.`,
        ),
        ...sellerIds.map((sellerId) =>
          this.notificationsService.createNotification(
            sellerId,
            NotificationType.ORDER_DELIVERED,
            `El pedido ${order.id} fue confirmado como entregado por el comprador.`,
          ),
        ),
      ]);
    } catch (error) {
      console.error('Error creating delivered notifications:', error);
    }

    return savedOrder;
  }

  async getUserOrders(userId: string) {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStripeSession(sessionId: string) {
    return this.orderRepository.findOne({
      where: { stripeSessionId: sessionId },
    });
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
        user: { id: userId },
      },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getTotalOrders(): Promise<number> {
    return this.orderRepository.count();
  }
}
