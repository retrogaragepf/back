import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notifications.entity';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from 'src/orders/order.module';
import { ProductsModule } from 'src/products/products.module';
import { NotificationsRepository } from './notifications.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    EmailModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
  ],
  providers: [NotificationsService, NotificationsRepository],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
