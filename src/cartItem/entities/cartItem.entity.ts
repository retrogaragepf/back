import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { Cart } from '../../carts/entities/cart.entity';
import { Product } from '../../products/entities/products.entity';

@Entity({
  name: 'cart_items',
})
@Unique(['cart', 'product'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'int',
    default: 1,
  })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtMoment: number;

  @ManyToOne(() => Cart, (cart) => cart.cartItems, {
    onDelete: 'CASCADE',
  })
  cart: Cart;

  @ManyToOne(() => Product, (product) => product.cartItem, {
    eager: true,
  })
  product: Product;
}
