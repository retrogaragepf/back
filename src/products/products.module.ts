import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsDbService } from './productsDb.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { Users } from 'src/users/entities/users.entity';
import { Categories } from 'src/categories/entities/Category.entity';
import { CloudinaryConfig } from 'src/config/cloudinary';
import { Eras } from 'src/eras/entities/era.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Users, Categories, Eras])],
  controllers: [ProductsController],
  providers: [ProductsDbService, CloudinaryConfig],
})
export class ProductsModule {}
