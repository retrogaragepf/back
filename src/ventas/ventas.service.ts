import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import {
  OrderItem,
  OrderItemStatus,
} from 'src/orders/entities/order-item.entity';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
  ) {}

  async getAllSalesForAdmin() {
    const ventas = await this.orderItemsRepository
      .createQueryBuilder('venta')

      .leftJoinAndSelect('venta.order', 'order')
      .leftJoinAndSelect('order.user', 'buyer')

      .leftJoinAndSelect('venta.product', 'product')
      .leftJoinAndSelect('product.user', 'seller')

      .select([
        'venta.id',
        'venta.title',
        'venta.unitPrice',
        'venta.quantity',
        'venta.subtotal',
        'venta.status',

        'order.id',
        'order.total',
        'order.status',
        'order.trackingCode',
        'order.createdAt',
        'order.updatedAt',

        'buyer.id',
        'buyer.name',
        'buyer.email',

        'product.id',
        'product.title',

        'seller.id',
        'seller.name',
        'seller.email',
      ])

      .orderBy('order.createdAt', 'DESC')
      .getMany();

    return ventas;
  }

  async getSellerSales(sellerId: string, status?: OrderItemStatus) {
    const qb = this.orderItemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.order', 'order')
      .leftJoinAndSelect('order.user', 'buyer')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('product.user', 'seller')
      .where('seller.id = :sellerId', { sellerId })
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      qb.andWhere('item.status = :status', { status });
    }

    return qb.getMany();
  }

  async getSellerStats(sellerId: string) {
    return this.orderItemsRepository
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('product.user', 'seller')
      .where('seller.id = :sellerId', { sellerId })
      .select([
        'COUNT(item.id) as totalSales',
        'SUM(item.subtotal) as totalRevenue',
        "SUM(CASE WHEN item.status = 'PAID' THEN 1 ELSE 0 END) as paid",
        "SUM(CASE WHEN item.status = 'SHIPPED' THEN 1 ELSE 0 END) as shipped",
        "SUM(CASE WHEN item.status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered",
        "SUM(CASE WHEN item.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled",
      ])
      .getRawOne();
  }

  async updateOrderItemStatus(
    sellerId: string,
    orderItemId: string,
    status: OrderItemStatus,
  ) {
    const item = await this.orderItemsRepository.findOne({
      where: { id: orderItemId },
      relations: ['product', 'product.user', 'order'],
    });

    if (!item) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (item.product.user.id !== sellerId) {
      throw new ForbiddenException('No puedes modificar esta venta');
    }

    item.status = status;
    await this.orderItemsRepository.save(item);
    await this.syncOrderStatus(item.order.id);

    return item;
  }

  private async syncOrderStatus(orderId: string) {
    const orderRepository = this.orderItemsRepository.manager.getRepository(Order);

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order || !order.items.length) {
      return;
    }

    const allDelivered = order.items.every(
      (item) => item.status === OrderItemStatus.DELIVERED,
    );
    const allShippedOrDelivered = order.items.every(
      (item) =>
        item.status === OrderItemStatus.SHIPPED ||
        item.status === OrderItemStatus.DELIVERED,
    );
    const allCancelled = order.items.every(
      (item) => item.status === OrderItemStatus.CANCELLED,
    );

    let nextStatus = OrderStatus.PAID;

    if (allDelivered) {
      nextStatus = OrderStatus.DELIVERED;
    } else if (allShippedOrDelivered) {
      nextStatus = OrderStatus.SHIPPED;
    } else if (allCancelled) {
      nextStatus = OrderStatus.CANCELLED;
    }

    if (order.status !== nextStatus) {
      order.status = nextStatus;
      await orderRepository.save(order);
    }
  }
}
