import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/products.entity';
import { FilesService } from './files.service';
import { filesController } from './files.controller';
import { CloudinaryConfig } from 'src/config/cloudinary';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [CloudinaryConfig, FilesService],
  controllers: [filesController],
})
export class FilesModule {}
