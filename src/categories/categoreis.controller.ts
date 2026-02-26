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
import { CategoriesService } from './categories.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/roles.enum';
import { CreateCategoryDto } from './dto/CreateCategory.DTO';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // =========================================
  // OBTENER TODAS LAS CATEGORÍAS
  // =========================================

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las categorías',
    description: 'Devuelve la lista completa de categorías disponibles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías obtenida correctamente',
  })
  getCategories() {
    return this.categoriesService.getCategories();
  }

  // =========================================
  // CREAR NUEVA CATEGORÍA (ADMIN)
  // =========================================

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Crear nueva categoría (Admin)',
    description: 'Permite a un administrador crear una nueva categoría.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Tecnología Retro',
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Categoría creada correctamente',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado',
  })
  @ApiForbiddenResponse({
    description: 'Requiere rol Admin',
  })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto.name);
  }
}
