import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/products.entity';
import { ErasController } from './eras.controller';
import { ErasService } from './eras.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ErasController],
  providers: [ErasService],
})
export class ErasModule {}
