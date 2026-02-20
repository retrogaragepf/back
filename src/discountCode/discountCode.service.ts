import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { DiscountCode } from './entities/discount_codes.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountRepo: Repository<DiscountCode>,
  ) {}

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = randomBytes(4).toString('hex').toUpperCase();

      const found = await this.discountRepo.findOne({
        where: { code },
      });

      if (!found) {
        exists = false;
      }
    }

    return code!;
  }

  async create(dto: CreateDiscountDto) {
    const code = await this.generateUniqueCode();

    const discountData: DeepPartial<DiscountCode> = {
      code,
      percentage: dto.percentage,
      expiresAt: dto.expiresAt ?? undefined,
    };

    const discount = this.discountRepo.create(discountData);

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
