import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationType } from './notification-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/users.entity';
import { Repository } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { Product } from 'src/products/entities/products.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly emailService: EmailService,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
  ) {
    return this.notificationsRepository.create(userId, type, message);
  }

  async getUserNotifications(
    userId: string,
    options?: { excludeTypes?: NotificationType[] },
  ) {
    return this.notificationsRepository.findByUser(
      userId,
      options?.excludeTypes ?? [],
    );
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationsRepository.markAsRead(notificationId, userId);
  }

  @Cron('0 30 13 * * *', {
    timeZone: 'America/Bogota',
  })
  async sendDailyHighlights() {
    console.log('Enviando resumen diario 1:30 PM...');
    try {
      const activeUsers = await this.usersRepository.find({
        where: { isActive: true },
      });

      if (!activeUsers.length) {
        console.log('No hay usuarios activos.');
        return;
      }

      const usersToNotify = activeUsers.slice(0, 10);
      const totalUsers = activeUsers.length;
      const totalOrders = await this.ordersRepository.count();
      const totalProducts = await this.productsRepository.count();

      for (const user of usersToNotify) {
        await this.emailService.sendDailySummary(
          user.email,
          user.name,
          totalUsers,
          totalOrders,
          totalProducts,
        );

        await this.notificationsRepository.create(
          user.id,
          NotificationType.DAILY_SUMMARY,
          `Resumen diario: ${totalOrders} ordenes y ${totalProducts} productos.`,
        );

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(
        `Resumen enviado correctamente a ${usersToNotify.length} usuarios.`,
      );
    } catch (error) {
      console.error('Error en cron:', error);
    }
  }
}
