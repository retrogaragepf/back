import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ErasService } from './eras.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/roles.enum';
import { CreateEraDto } from './dto/create-era.dto';

@ApiTags('Eras')
@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}

  // =========================================
  // OBTENER TODAS LAS ERAS
  // =========================================

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las eras',
    description: 'Devuelve la lista completa de eras disponibles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de eras obtenida correctamente',
  })
  getEras() {
    return this.erasService.getEras();
  }

  // =========================================
  // CREAR NUEVA ERA (ADMIN)
  // =========================================

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Crear nueva era (Admin)',
    description: 'Permite a un administrador crear una nueva era.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Década del 80',
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Era creada correctamente',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado',
  })
  @ApiForbiddenResponse({
    description: 'Requiere rol Admin',
  })
  createEra(@Body() dto: CreateEraDto) {
    return this.erasService.createEra(dto.name);
  }
}
