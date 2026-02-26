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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Ventas')
@ApiBearerAuth()
@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  // =========================================
  // ADMIN - TODAS LAS VENTAS
  // =========================================

  @Get('admin/todas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Obtener todas las ventas (Admin)',
    description:
      'Devuelve todas las ventas registradas en el sistema. Requiere rol ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista completa de ventas',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'No tiene permisos de administrador' })
  getAllSalesForAdmin() {
    return this.ventasService.getAllSalesForAdmin();
  }

  // =========================================
  // VENDEDOR - MIS VENTAS
  // =========================================

  @Get('mis-ventas')
  @ApiOperation({
    summary: 'Obtener mis ventas',
    description:
      'Devuelve las ventas del vendedor autenticado. Puede filtrarse por estado.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderItemStatus,
    description: 'Filtrar ventas por estado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas del vendedor',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  getSellerSales(
    @CurrentUser() user: { id: string },
    @Query('status') status?: OrderItemStatus,
  ) {
    return this.ventasService.getSellerSales(user.id, status);
  }

  // =========================================
  // VENDEDOR - ESTADÍSTICAS
  // =========================================

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener estadísticas del vendedor',
    description:
      'Devuelve estadísticas como total vendido, cantidad de ventas, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del vendedor',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  getSellerStats(@CurrentUser() user: { id: string }) {
    return this.ventasService.getSellerStats(user.id);
  }

  // =========================================
  // ACTUALIZAR ESTADO DE UNA VENTA
  // =========================================

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar estado de una venta',
    description:
      'Permite al vendedor actualizar el estado de un item de venta propio.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del item de la orden',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(OrderItemStatus),
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({
    description: 'No tiene permiso para modificar esta venta',
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderItemStatus,
    @CurrentUser() user: { id: string },
  ) {
    return this.ventasService.updateOrderItemStatus(user.id, id, status);
  }
}
