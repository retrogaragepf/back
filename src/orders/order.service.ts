import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async getAllOrders() {
    return this.orderRepository.find({
      relations: ['user', 'orderItems', 'orderItems.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async dispatchOrder(orderId: string, sellerId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'orderItems',
        'orderItems.product',
        'orderItems.product.user',
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be PAID to dispatch');
    }

    // validar que el vendedor sea dueño del producto
    const isSeller = order.items.every(
      (item) => item.product.user.id === sellerId,
    );

    if (!isSeller) {
      throw new ForbiddenException('You are not the seller of this order');
    }

    order.status = OrderStatus.SHIPPED;
    return this.orderRepository.save(order);
  }

  async receiveOrder(orderId: string, buyerId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(
        'Order must be SHIPPED to confirm delivery',
      );
    }

    // validar que sea el comprador
    if (order.user.id !== buyerId) {
      throw new ForbiddenException('You are not the buyer of this order');
    }

    order.status = OrderStatus.DELIVERED;
    return this.orderRepository.save(order);
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
