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

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    private readonly dataSource: DataSource,
  ) {}

  async addToCart(userId: string, dto: AddToCartDto) {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId, status: ProductStatus.APPROVED },
        lock: { mode: 'pessimistic_write' },
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
      });

      if (!cart) {
        cart = manager.create(Cart, {
          user: { id: userId },
        });
        cart = await manager.save(cart);
      }

      let item = await manager.findOne(CartItem, {
        where: {
          cart: { id: cart.id },
          product: { id: product.id },
        },
      });

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
        cart: cart,
        product: product,
      });

      return await manager.save(newItem);
    });
  }

  async getCart(userId: string) {
    return this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['cartItems', 'cartItems.product'],
    });
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
