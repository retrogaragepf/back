import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { ProductsDbService } from './productsDb.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
import { Request } from 'express';
import { CreateProductDto } from './dto/products.dto';
import { Product } from './entities/products.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Users } from 'src/users/entities/users.entity';

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

  @Get('my-products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMyProducts(@Req() req: Request) {
    return this.productsDbService.getMyProducts(req.user as Users);
  }

  @Get(':id')
  getProductById(@Param('id') id: string) {
    return this.productsDbService.getProductById(id);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        categoryId: { type: 'string' },
        erasId: { type: 'string' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  createProduct(
    @Body() product: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.productsDbService.createProduct(product, file, req.user);
  }

  @Put(':id')
  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/approve')
  async approveProduct(@Param('id') id: string) {
    return this.productsDbService.approveProduct(id);
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/reject')
  async rejectProduct(@Param('id') id: string) {
    return this.productsDbService.rejectProduct(id);
  }
}
