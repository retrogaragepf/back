import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsDbService } from './productsDb.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateProductDto } from './dto/products.dto';
import { Product } from './entities/products.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsDbService: ProductsDbService) {}

  @Get()
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard)
  getProducts(@Query('page') page: string, @Query('limit') limit: string) {
    if (limit && page) {
      return this.productsDbService.getProducts(+page, +limit);
    }
    return this.productsDbService.getProducts();
  }

  @Get(':id')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard)
  getProductById(@Param('id') id: string) {
    return this.productsDbService.getProductById(id);
  }

  @Post()
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  createProduct(
    @Body() product: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsDbService.createProduct(product, file);
  }

  @Put(':id')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard)
  updateProduct(@Body() product: Partial<Product>, @Param('id') id: string) {
    return this.productsDbService.updateProduct(id, product);
  }

  @Delete(':id')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard)
  deleteProduct(@Param('id') id: string) {
    return this.productsDbService.deleteProduct(id);
  }
}
