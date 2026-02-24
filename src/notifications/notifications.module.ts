import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from 'src/orders/order.module';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [EmailModule, UsersModule, OrdersModule, ProductsModule],
  providers: [NotificationsService],
})
export class NotificationsModule {}
