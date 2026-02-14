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
    const product = await this.productsRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Not enough stock');
    }

    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const existingItem = await this.cartItemsRepository.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: dto.productId },
      },
    });

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      return await this.cartItemsRepository.save(existingItem);
    }

    const newItem = this.cartItemsRepository.create({
      cart,
      product,
      quantity: dto.quantity,
    });

    return await this.cartItemsRepository.save(newItem);
  }

  async getCart(userId: string) {
    return this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['cartItems', 'cartItems.product'],
    });
  }

  async removeItem(itemId: string) {
    return this.cartItemsRepository.delete(itemId);
  }
}
