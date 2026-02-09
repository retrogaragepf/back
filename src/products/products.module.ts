import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsDbService } from './productsDb.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsDbService],
})
export class ProductsModule {}
