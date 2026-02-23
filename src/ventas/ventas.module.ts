import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Product } from 'src/products/entities/products.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem, Product])],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
