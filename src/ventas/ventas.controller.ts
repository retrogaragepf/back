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
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @ApiTags('Ventas Admin')
  @ApiBearerAuth()
  @Get('admin/todas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  getAllSalesForAdmin() {
    return this.ventasService.getAllSalesForAdmin();
  }

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
