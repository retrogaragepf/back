import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VentasService } from './ventas.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { OrderItemStatus } from 'src/orders/entities/order-item.entity';

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get('mis-ventas')
  getSellerSales(
    @CurrentUser() user: { id: string },
    @Query('status') status?: OrderItemStatus,
  ) {
    return this.ventasService.getSellerSales(user.id, status);
  }

  @Get('stats')
  getSellerStats(@CurrentUser() user: { id: string }) {
    return this.ventasService.getSellerStats(user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderItemStatus,
    @CurrentUser() user: { id: string },
  ) {
    return this.ventasService.updateOrderItemStatus(user.id, id, status);
  }
}
