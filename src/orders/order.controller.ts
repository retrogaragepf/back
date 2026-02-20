import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/users/roles.enum';
import { Roles } from 'src/decorators/roles.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get()
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/dispatch')
  async dispatchOrder(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.dispatchOrder(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/receive')
  async receiveOrder(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.receiveOrder(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyOrders(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.ordersService.getUserOrders(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderById(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;

    return this.ordersService.getOrderById(id, userId);
  }
}
