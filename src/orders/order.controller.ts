import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/users/roles.enum';
import { Roles } from 'src/decorators/roles.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // =========================================
  // ADMIN - TODAS LAS ÓRDENES
  // =========================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get()
  @ApiOperation({
    summary: 'Obtener todas las órdenes (Admin)',
    description: 'Devuelve todas las órdenes del sistema. Requiere rol ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Lista completa de órdenes' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'No tiene permisos de administrador' })
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  // =========================================
  // DESPACHAR ORDEN (VENDEDOR)
  // =========================================

  @Patch(':id/dispatch')
  @ApiOperation({
    summary: 'Despachar orden',
    description: 'Permite al vendedor marcar una orden como despachada.',
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Orden despachada correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para despachar esta orden',
  })
  async dispatchOrder(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.dispatchOrder(id, userId);
  }

  // =========================================
  // CONFIRMAR RECEPCIÓN (COMPRADOR)
  // =========================================

  @Patch(':id/receive')
  @ApiOperation({
    summary: 'Confirmar recepción de orden',
    description: 'Permite al comprador confirmar que recibió la orden.',
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Orden confirmada correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para confirmar esta orden',
  })
  async receiveOrder(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.receiveOrder(id, userId);
  }

  // =========================================
  // MIS ÓRDENES
  // =========================================

  @Get('me')
  @ApiOperation({
    summary: 'Obtener mis órdenes',
    description: 'Devuelve todas las órdenes del usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de órdenes del usuario' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  async getMyOrders(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.ordersService.getUserOrders(userId);
  }

  // =========================================
  // OBTENER ORDEN POR ID
  // =========================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener orden por ID',
    description:
      'Devuelve una orden específica si pertenece al usuario autenticado o si es Admin.',
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Orden encontrada' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para ver esta orden',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async getOrderById(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.getOrderById(id, userId);
  }
}
