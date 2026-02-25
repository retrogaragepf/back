import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notifications.entity';
import { NotificationType } from './notification-type.enum';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(userId: string, type: NotificationType, message: string) {
    const notification = this.notificationRepository.create({
      userId,
      type,
      message,
    });
    return this.notificationRepository.save(notification);
  }

  async findByUser(userId: string, excludeTypes: NotificationType[] = []) {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (excludeTypes.length > 0) {
      query.andWhere('notification.type NOT IN (:...excludeTypes)', {
        excludeTypes,
      });
    }

    return query.orderBy('notification.createdAt', 'DESC').getMany();
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    notification.read = true;
    return this.notificationRepository.save(notification);
  }
}
