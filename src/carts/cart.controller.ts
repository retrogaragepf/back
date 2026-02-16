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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
import { Request } from 'express';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/cart.dto';
import { Users } from 'src/users/entities/users.entity';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addToCart(@Body() dto: AddToCartDto, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.cartService.addToCart(userId, dto);
  }

  @Get()
  async getCart(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.cartService.getCart(userId);
  }

  @Patch('item/:id')
  async updateItemQuantity(
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItemQuantity(itemId, quantity);
  }

  @Delete('item/:id')
  async removeItem(@Param('id', ParseUUIDPipe) itemId: string) {
    return this.cartService.removeItem(itemId);
  }
}
