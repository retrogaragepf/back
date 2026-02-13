import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/products.dto';
import toStream from 'buffer-to-stream';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Categories } from 'src/categories/entities/Category.entity';
import { Users } from 'src/users/entities/users.entity';
import { ProductStatus } from './product-status.enum';
import { Eras } from 'src/eras/entities/era.entity';

@Injectable()
export class ProductsDbService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Eras)
    private readonly erasRepository: Repository<Eras>,
    @Inject('CLOUDINARY')
    private readonly cloudinaryClient: typeof cloudinary,
  ) {}

  async getProducts(page: number = 1, limit: number = 5): Promise<Product[]> {
    return this.productsRepository.find({
      skip: (page - 1) * limit,
      take: limit,
    });
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

    const era = await this.erasRepository.findOne({
      where: { id: dto.erasId },
    });

    if (!era) {
      throw new NotFoundException('Era not found');
    }

    const image = await this.uploadToCloudinary(file);

    const product = this.productsRepository.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      imgUrl: image,
      category: category,
      era: era,
      user: user,
      status: ProductStatus.PENDING,
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
