import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/products.entity';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { CloudinaryConfig } from 'src/config/cloudinary';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), EmailModule],
  providers: [CloudinaryConfig, FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
