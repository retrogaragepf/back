import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/products.dto';
import toStream from 'buffer-to-stream';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Categories } from 'src/categories/entities/Category.entity';
import { Users } from 'src/users/entities/users.entity';

@Injectable()
export class ProductsDbService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @Inject('CLOUDINARY')
    private readonly cloudinaryClient: typeof cloudinary,
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

  async createProduct(
    dto: CreateProductDto,
    file: Express.Multer.File,
    user: Users,
  ): Promise<Product> {
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const imageUrl = await this.uploadToCloudinary(file);

    const product = this.productsRepository.create({
      ...dto,
      imgUrl: imageUrl,
      category,
      user,
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

  private uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = this.cloudinaryClient.uploader.upload_stream(
        { folder: 'products' },
        (error, result: UploadApiResponse) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }
}
