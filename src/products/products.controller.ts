import { Controller, Get } from '@nestjs/common';
import { ProductsDbService } from './productsDb.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsDbService) {}

  @Get()
  getAllProducts() {
    return this.productsService.getAllProducts();
  }
}
