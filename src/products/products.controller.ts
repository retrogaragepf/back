import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsDbService } from './productsDb.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/products.dto';
import { Product } from './entities/products.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsDbService: ProductsDbService) {}

  @Get()
  getProducts(@Query('page') page: string, @Query('limit') limit: string) {
    if (limit && page) {
      return this.productsDbService.getProducts(+page, +limit);
    }
    return this.productsDbService.getProducts(
      Number(page) || 1,
      Number(limit) || 5,
    );
  }

  @Get(':id')
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  getProductById(@Param('id') id: string) {
    return this.productsDbService.getProductById(id);
  }

  @Post()
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  createProduct(
    @Body() product: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.productsDbService.createProduct(product, file, req.user);
  }

  @Put(':id')
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  updateProduct(@Body() product: Partial<Product>, @Param('id') id: string) {
    return this.productsDbService.updateProduct(id, product);
  }

  @Delete(':id')
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  deleteProduct(@Param('id') id: string) {
    return this.productsDbService.deleteProduct(id);
  }
}
