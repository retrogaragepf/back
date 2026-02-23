import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      .leftJoin('product.seller', 'seller')
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
      relations: ['product', 'product.seller'],
    });

    if (!item) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (item.product.user.id !== sellerId) {
      throw new ForbiddenException('No puedes modificar esta venta');
    }

    item.status = status;
    return this.orderItemsRepository.save(item);
  }
}
