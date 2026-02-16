import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../users/entities/users.entity';
import { CartItem } from '../../cartItem/entities/cartItem.entity';

@Entity({
  name: 'carts',
})
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Users, (user) => user.cart)
  @JoinColumn()
  user: Users;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: true,
  })
  cartItems: CartItem[];
}
