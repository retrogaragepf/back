import { CategoriesModule } from 'src/categories/categories.module';
import { ErasModule } from 'src/eras/eras.module';
import { ProductsModule } from 'src/products/products.module';
import { SeederService } from './seeder.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [CategoriesModule, ErasModule, ProductsModule],
  providers: [SeederService],
})
export class SeederModule {}
