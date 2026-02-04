import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './productsDb.service';
import { ProductsRepository } from './products.repository';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
