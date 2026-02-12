import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateCategoryDto } from './dto/CreateCategory.DTO';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // @Get('seeder')
  // seeder() {
  //   return this.categoriesService.seeder();
  // }

  @Get()
  getCategories() {
    return this.categoriesService.getCategories();
  }

  @Post()
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  createCategory(@Body() category: CreateCategoryDto) {
    return this.categoriesService.saveCategories(category);
  }
}
