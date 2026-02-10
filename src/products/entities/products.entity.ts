import { Categories } from 'src/categories/entities/Category.entity';
import { Eras } from 'src/eras/entities/era.entity';
import { Users } from 'src/users/entities/users.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  stock: number;

  @Column({
    type: 'varchar',
    default: 'https://via.placeholder.com/150',
  })
  imgUrl: string;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => Users, (user) => user.products, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Categories, (category) => category.products, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Categories;

  @ManyToOne(() => Eras, (eras) => eras.products)
  era: Eras;
}
