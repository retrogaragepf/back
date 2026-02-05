import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/products.dto';

@Injectable()
export class ProductsDbService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async getProducts(page: number = 1, limit: number = 5): Promise<Product[]> {
    const products = await this.productsRepository.find();

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return products.slice(startIndex, endIndex);
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.productsRepository.findOne({ where: { id } });
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = this.productsRepository.create({
      ...dto,
      category,
    });

    return await this.productsRepository.save(product);
  }

  async updateProduct(
    id: string,
    product: Partial<Product>,
  ): Promise<Product | null> {
    await this.productsRepository.update(id, product);
    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.productsRepository.delete(id);
  }
}
