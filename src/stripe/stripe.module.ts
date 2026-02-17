import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/products.entity';
import { Order } from 'src/orders/entities/order.entity';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { CartItem } from 'src/cartItem/entities/cartItem.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, OrderItem, CartItem])],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
