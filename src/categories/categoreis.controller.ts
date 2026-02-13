import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 🔹 Obtener todas las categorías
  @Get()
  getCategories() {
    return this.categoriesService.getCategories();
  }

  // 🔹 Crear una categoría (protegido)
  @Post()
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  createCategory(@Body('name') name: string) {
    return this.categoriesService.createCategory(name);
  }
}
