import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notifications.entity';
import { EmailModule } from '../email/email.module';
import { NotificationsRepository } from './notifications.repository';
import { Users } from 'src/users/entities/users.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Product } from 'src/products/entities/products.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Users, Order, Product]),
    EmailModule,
  ],
  providers: [NotificationsService, NotificationsRepository],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
