import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscountCode } from './entities/discount_codes.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountRepo: Repository<DiscountCode>,
  ) {}

  // ...existing code...
  async create(dto: CreateDiscountDto) {
    const code = dto.code.toUpperCase();
    const existing = await this.discountRepo.findOne({
      where: { code },
    });

    if (existing) {
      throw new BadRequestException('Code already exists');
    }

    const discount = this.discountRepo.create({
      code,
      percentage: dto.percentage,
      expiresAt: dto.expiresAt ?? undefined,
    });

    return this.discountRepo.save(discount);
  }

  async findAll() {
    return this.discountRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async validateCode(code: string) {
    const discount = await this.discountRepo.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        isUsed: false,
      },
    });

    if (!discount) {
      throw new BadRequestException('Invalid or already used code');
    }

    if (discount.expiresAt && discount.expiresAt < new Date()) {
      throw new BadRequestException('Discount expired');
    }

    return discount;
  }

  async markAsUsed(code: string, userId: string, manager?: any) {
    const repo = manager
      ? manager.getRepository(DiscountCode)
      : this.discountRepo;

    const discount = await repo.findOne({
      where: {
        code: code.toUpperCase(),
        isUsed: false,
      },
    });

    if (!discount) {
      throw new BadRequestException('Discount already used');
    }

    discount.isUsed = true;
    discount.usedAt = new Date();
    discount.usedByUserId = userId;

    return repo.save(discount);
  }

  async deactivate(id: string) {
    const discount = await this.discountRepo.findOne({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    discount.isActive = false;
    return this.discountRepo.save(discount);
  }
}
