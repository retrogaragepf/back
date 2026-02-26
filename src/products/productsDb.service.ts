import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { EmailService } from 'src/email/email.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification-type.enum';

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
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getProducts(): Promise<Product[]> {
    return this.productsRepository.find({
      relations: ['user', 'category', 'era'],
    });
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['user', 'category', 'era'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getMyProducts(user: Users): Promise<Product[]> {
    return this.productsRepository.find({
      where: {
        user: { id: user.id },
      },
      relations: ['category', 'era'],
      order: { createdAt: 'DESC' },
    });
  }

  async createProduct(
    dto: CreateProductDto,
    file: Express.Multer.File | undefined,
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

    const providedImgUrl = dto.imgUrl?.trim();
    const image =
      providedImgUrl ||
      (file ? await this.uploadToCloudinary(file) : undefined);

    if (!image) {
      throw new BadRequestException(
        'You must provide either an image file or imgUrl.',
      );
    }

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

    const savedProduct = await this.productsRepository.save(product);

    if (user?.email) {
      try {
        await this.emailService.sendProductImagePublishedEmail(
          user.email,
          user.name || 'usuario',
          savedProduct.title,
          savedProduct.imgUrl,
        );
      } catch (error) {
        console.error('Error sending product image email:', error);
      }
    }

    return savedProduct;
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
    if (!file?.buffer) {
      throw new BadRequestException('Invalid image file.');
    }

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
  async approveProduct(id: string): Promise<Product> {
    const product = await this.getProductById(id);
    if (!product) throw new NotFoundException('Product not found');
    product.status = ProductStatus.APPROVED;
    const savedProduct = await this.productsRepository.save(product);

    if (savedProduct.user?.id) {
      try {
        await this.notificationsService.createNotification(
          savedProduct.user.id,
          NotificationType.PRODUCT_APPROVED,
          `Tu producto "${savedProduct.title}" fue aprobado por el admin.`,
        );
      } catch (error) {
        console.error('Error creating product approved notification:', error);
      }
    }

    if (savedProduct.user?.email) {
      try {
        await this.emailService.sendProductReviewStatusEmail(
          savedProduct.user.email,
          savedProduct.user.name || 'usuario',
          savedProduct.title,
          'approved',
        );
      } catch (error) {
        console.error('Error sending product approved email:', error);
      }
    }

    return savedProduct;
  }

  async rejectProduct(id: string): Promise<Product> {
    const product = await this.getProductById(id);
    if (!product) throw new NotFoundException('Product not found');
    product.status = ProductStatus.REJECTED;
    const savedProduct = await this.productsRepository.save(product);

    if (savedProduct.user?.id) {
      try {
        await this.notificationsService.createNotification(
          savedProduct.user.id,
          NotificationType.PRODUCT_REJECTED,
          `Tu producto "${savedProduct.title}" fue rechazado por el admin.`,
        );
      } catch (error) {
        console.error('Error creating product rejected notification:', error);
      }
    }

    if (savedProduct.user?.email) {
      try {
        await this.emailService.sendProductReviewStatusEmail(
          savedProduct.user.email,
          savedProduct.user.name || 'usuario',
          savedProduct.title,
          'rejected',
        );
      } catch (error) {
        console.error('Error sending product rejected email:', error);
      }
    }

    return savedProduct;
  }

  async getTotalProducts(): Promise<number> {
    return this.productsRepository.count();
  }
}
