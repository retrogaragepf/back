import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiBody,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
import { Request } from 'express';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/cart.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // =========================================
  // AGREGAR PRODUCTO AL CARRITO
  // =========================================

  @Post()
  @ApiOperation({
    summary: 'Agregar producto al carrito',
    description:
      'Agrega un producto al carrito del usuario autenticado. Si ya existe, incrementa la cantidad.',
  })
  @ApiResponse({ status: 201, description: 'Producto agregado al carrito' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'Usuario bloqueado' })
  async addToCart(@Body() dto: AddToCartDto, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.cartService.addToCart(userId, dto);
  }

  // =========================================
  // OBTENER CARRITO DEL USUARIO
  // =========================================

  @Get()
  @ApiOperation({
    summary: 'Obtener mi carrito',
    description: 'Devuelve el carrito del usuario autenticado con sus items.',
  })
  @ApiResponse({ status: 200, description: 'Carrito del usuario' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  async getCart(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.cartService.getCart(userId);
  }

  // =========================================
  // ACTUALIZAR CANTIDAD DE UN ITEM
  // =========================================

  @Patch('item/:id')
  @ApiOperation({
    summary: 'Actualizar cantidad de un item del carrito',
    description:
      'Modifica la cantidad de un producto específico dentro del carrito.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del item del carrito',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: {
          type: 'number',
          example: 2,
        },
      },
      required: ['quantity'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cantidad actualizada correctamente',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  async updateItemQuantity(
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItemQuantity(itemId, quantity);
  }

  // =========================================
  // ELIMINAR ITEM DEL CARRITO
  // =========================================

  @Delete('item/:id')
  @ApiOperation({
    summary: 'Eliminar item del carrito',
    description: 'Elimina un producto específico del carrito.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del item del carrito',
  })
  @ApiResponse({ status: 200, description: 'Item eliminado correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  async removeItem(@Param('id', ParseUUIDPipe) itemId: string) {
    return this.cartService.removeItem(itemId);
  }
}
