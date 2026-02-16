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

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async addToCart(userId: string, dto: AddToCartDto) {
    return await this.cartsRepository.manager.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      let cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
      });

      if (!cart) {
        cart = manager.create(Cart, {
          user: { id: userId },
        });

        cart = await manager.save(cart);
      }

      let existingItem = await manager.findOne(CartItem, {
        where: {
          cart: { id: cart.id },
          product: { id: product.id },
        },
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + dto.quantity;

        if (newQuantity > product.stock) {
          throw new BadRequestException('Not enough stock');
        }

        existingItem.quantity = newQuantity;
        return await manager.save(existingItem);
      }

      if (dto.quantity > product.stock) {
        throw new BadRequestException('Not enough stock');
      }

      const newItem = manager.create(CartItem, {
        cart,
        product,
        quantity: dto.quantity,
      });

      return await manager.save(newItem);
    });
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    return await this.cartsRepository.manager.transaction(async (manager) => {
      const item = await manager.findOne(CartItem, {
        where: { id: itemId },
        relations: ['product'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!item) {
        throw new NotFoundException('Cart item not found');
      }

      if (quantity <= 0) {
        await manager.delete(CartItem, itemId);
        return { message: 'Item removed' };
      }

      if (quantity > item.product.stock) {
        throw new BadRequestException('Not enough stock');
      }

      item.quantity = quantity;
      return await manager.save(item);
    });
  }

  async getCart(userId: string) {
    return this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['cartItems', 'cartItems.product'],
    });
  }

  async removeItem(itemId: string) {
    const result = await this.cartItemsRepository.delete(itemId);

    if (result.affected === 0) {
      throw new NotFoundException('Cart item not found');
    }

    return { message: 'Item removed successfully' };
  }
}
