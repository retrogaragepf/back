import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from '../cartItem/entities/cartItem.entity';
import { Product } from '../products/entities/products.entity';
import { AddToCartDto } from './dto/cart.dto';
import { DataSource } from 'typeorm';
import { ProductStatus } from 'src/products/product-status.enum';
import { Users } from 'src/users/entities/users.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,

    private readonly dataSource: DataSource,
  ) {}

  async addToCart(userId: string, dto: AddToCartDto) {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId, status: ProductStatus.APPROVED },
      });

      if (!product) {
        throw new NotFoundException('Product not found or not available');
      }

      if (dto.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }

      if (dto.quantity > product.stock) {
        throw new BadRequestException('Not enough stock');
      }

      let cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['user'],
      });

      if (!cart) {
        const user = await manager.findOne(Users, {
          where: { id: userId },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        cart = manager.create(Cart, { user });
        cart = await manager.save(cart);
      }

      let item = await manager
        .createQueryBuilder(CartItem, 'item')
        .leftJoin('item.cart', 'cart')
        .where('cart.id = :cartId', { cartId: cart.id })
        .andWhere('item.product_id = :productId', { productId: product.id })
        .getOne();

      if (item) {
        const newQuantity = item.quantity + dto.quantity;

        if (newQuantity > product.stock) {
          throw new BadRequestException('Not enough stock');
        }

        item.quantity = newQuantity;
        return await manager.save(item);
      }

      const newItem = manager.create(CartItem, {
        quantity: dto.quantity,
        priceAtMoment: Number(product.price),
        cart,
        product,
      });

      await manager.save(newItem);

      const updatedCart = await manager.findOne(Cart, {
        where: { id: cart.id },
        relations: [
          'cartItems',
          'cartItems.product',
          'cartItems.product.category',
          'cartItems.product.era',
        ],
      });

      return updatedCart;
    });
  }

  async getCart(userId: string) {
    let cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'cartItems',
        'cartItems.product',
        'cartItems.product.category',
        'cartItems.product.era',
      ],
    });

    if (!cart) {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      cart = this.cartsRepository.create({ user });
      cart = await this.cartsRepository.save(cart);
    }

    return cart;
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const item = await this.cartItemsRepository.findOne({
      where: { id: itemId },
      relations: ['product'],
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity > item.product.stock) {
      throw new BadRequestException('Not enough stock available');
    }

    item.quantity = quantity;

    return await this.cartItemsRepository.save(item);
  }

  async removeItem(itemId: string) {
    const result = await this.cartItemsRepository.delete(itemId);

    if (result.affected === 0) {
      throw new NotFoundException('Cart item not found');
    }

    return { message: 'Item removed successfully' };
  }
}
