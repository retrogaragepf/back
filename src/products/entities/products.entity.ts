import { Categories } from 'src/categories/entities/Category.entity';
import { Eras } from 'src/eras/entities/era.entity';
import { Users } from 'src/users/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductStatus } from '../product-status.enum';
import { CartItem } from 'src/cartItem/entities/cartItem.entity';

@Entity('PRODUCTS')
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

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.PENDING,
  })
  status: ProductStatus;

  @ManyToOne(() => Users, (user) => user.products, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItem: CartItem[];

  @ManyToOne(() => Categories, (category) => category.products, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Categories;

  @ManyToOne(() => Eras, (eras) => eras.products, { eager: true })
  era: Eras;
}
