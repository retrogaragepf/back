import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsDbService } from './productsDb.service';
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

  // =========================================
  // OBTENER TODOS LOS PRODUCTOS
  // =========================================

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los productos',
    description: 'Devuelve la lista de productos disponibles.',
  })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  getProducts() {
    return this.productsDbService.getProducts();
  }

  // =========================================
  // OBTENER MIS PRODUCTOS (VENDEDOR)
  // =========================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-products')
  @ApiOperation({
    summary: 'Obtener mis productos',
    description: 'Devuelve los productos creados por el usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de productos del usuario' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  getMyProducts(@Req() req: Request) {
    return this.productsDbService.getMyProducts(req.user as Users);
  }

  // =========================================
  // OBTENER PRODUCTO POR ID
  // =========================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener producto por ID',
    description: 'Devuelve un producto específico por su ID.',
  })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  getProductById(@Param('id') id: string) {
    return this.productsDbService.getProductById(id);
  }

  // =========================================
  // CREAR PRODUCTO
  // =========================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  @ApiOperation({
    summary: 'Crear producto',
    description:
      'Permite a un usuario autenticado crear un producto. Puede incluir imagen.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'title',
        'description',
        'price',
        'stock',
        'categoryId',
        'erasId',
      ],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        categoryId: { type: 'string' },
        erasId: { type: 'string' },
        imgUrl: { type: 'string', format: 'uri' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Producto creado correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'Usuario bloqueado' })
  createProduct(
    @Body() product: CreateProductDto,
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsDbService.createProduct(product, file, req.user);
  }

  // =========================================
  // ACTUALIZAR PRODUCTO
  // =========================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar producto',
    description: 'Actualiza un producto existente por ID.',
  })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado correctamente',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  updateProduct(@Body() product: Partial<Product>, @Param('id') id: string) {
    return this.productsDbService.updateProduct(id, product);
  }

  // =========================================
  // ELIMINAR PRODUCTO
  // =========================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar producto',
    description: 'Elimina un producto por ID.',
  })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  deleteProduct(@Param('id') id: string) {
    return this.productsDbService.deleteProduct(id);
  }

  // =========================================
  // ADMIN - APROBAR PRODUCTO
  // =========================================

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Aprobar producto (Admin)',
    description: 'Aprueba un producto pendiente. Requiere rol ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto aprobado correctamente' })
  @ApiForbiddenResponse({ description: 'No tiene permisos de administrador' })
  async approveProduct(@Param('id') id: string) {
    return this.productsDbService.approveProduct(id);
  }

  // =========================================
  // ADMIN - RECHAZAR PRODUCTO
  // =========================================

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Rechazar producto (Admin)',
    description: 'Rechaza un producto pendiente. Requiere rol ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto rechazado correctamente' })
  @ApiForbiddenResponse({ description: 'No tiene permisos de administrador' })
  async rejectProduct(@Param('id') id: string) {
    return this.productsDbService.rejectProduct(id);
  }
}
