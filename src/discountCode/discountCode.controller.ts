import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DiscountService } from './discountCode.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../users/roles.enum';

@ApiTags('Discounts')
@ApiBearerAuth()
@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  // =========================================
  // CREAR CÓDIGO DE DESCUENTO (ADMIN)
  // =========================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Crear código de descuento (Admin)',
    description:
      'Permite a un administrador crear un nuevo código de descuento.',
  })
  @ApiResponse({
    status: 201,
    description: 'Código de descuento creado correctamente',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'Requiere rol Admin' })
  create(@Body() dto: CreateDiscountDto) {
    return this.discountService.create(dto);
  }

  // =========================================
  // VALIDAR CUPÓN
  // =========================================

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Validar código de descuento',
    description:
      'Valida un código de descuento y devuelve si es válido junto con su información.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de validación del cupón',
  })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.discountService.validateCoupon(dto.code);
  }

  // =========================================
  // LISTAR TODOS LOS DESCUENTOS (ADMIN)
  // =========================================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Listar todos los códigos de descuento (Admin)',
    description:
      'Devuelve todos los códigos de descuento creados en el sistema.',
  })
  @ApiResponse({ status: 200, description: 'Lista de códigos de descuento' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'Requiere rol Admin' })
  findAll() {
    return this.discountService.findAll();
  }

  // =========================================
  // DESACTIVAR CUPÓN (ADMIN)
  // =========================================

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Desactivar código de descuento (Admin)',
    description:
      'Desactiva un código de descuento específico para que no pueda seguir utilizándose.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del código de descuento',
  })
  @ApiResponse({ status: 200, description: 'Código desactivado correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'Requiere rol Admin' })
  deactivate(@Param('id') id: string) {
    return this.discountService.deactivate(id);
  }
}
