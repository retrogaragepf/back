import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categories } from './entities/Category.entity';
import * as data from '../data.json';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
  ) {}
  async seeder() {
    const categories = new Set(data.map((item) => item.category));
    const categoriesArray = Array.from(categories);
    const categoriesData = categoriesArray.map((category) => ({
      name: category,
    }));

    await this.categoriesRepository.upsert(categoriesData, ['name']);

    return 'Categories seeded successfully';
  }

  async getCategories() {
    return this.categoriesRepository.find();
  }

  async saveCategories(category: Categories) {
    return this.categoriesRepository.save(category);
  }
}
