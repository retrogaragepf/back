import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'PRODUCTS',
})
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
