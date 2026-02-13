import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/products.entity';
import { ErasController } from './eras.controller';
import { ErasService } from './eras.service';
import { Eras } from './entities/era.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Eras])],
  controllers: [ErasController],
  providers: [ErasService],
  exports: [ErasService],
})
export class ErasModule {}
