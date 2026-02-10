import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateCategoryDto } from './dto/CreateCategory.DTO';

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
  @UseGuards(AuthGuard)
  createCategory(@Body() category: CreateCategoryDto) {
    return this.categoriesService.saveCategories(category);
  }
}
