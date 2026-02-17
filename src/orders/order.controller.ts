import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyOrders(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.getUserOrders(userId);
  }
}
