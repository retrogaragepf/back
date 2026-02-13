import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Categories } from './entities/Category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
  ) {}

  //  Obtener todas las categorías
  async getCategories(): Promise<Categories[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  //  Crear una sola categoría
  async createCategory(name: string): Promise<Categories> {
    const slug = this.generateSlug(name);

    const existing = await this.categoriesRepository.findOne({
      where: [{ name }, { slug }],
    });

    if (existing) {
      throw new BadRequestException('Category already exists');
    }

    const category = this.categoriesRepository.create({
      name,
      slug,
    });

    return this.categoriesRepository.save(category);
  }

  //  Crear múltiples (ideal para seeder)
  async addCategories(categories: { name: string }[]): Promise<Categories[]> {
    const formatted = categories.map((cat) => ({
      name: cat.name,
      slug: this.generateSlug(cat.name),
    }));

    const slugs = formatted.map((cat) => cat.slug);

    const existing = await this.categoriesRepository.find({
      where: { slug: In(slugs) },
    });

    const existingSlugs = existing.map((cat) => cat.slug);

    const newCategories = formatted.filter(
      (cat) => !existingSlugs.includes(cat.slug),
    );

    if (!newCategories.length) return existing;

    const created = this.categoriesRepository.create(newCategories);
    return this.categoriesRepository.save(created);
  }

  //  Generador de slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/\s+/g, '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
