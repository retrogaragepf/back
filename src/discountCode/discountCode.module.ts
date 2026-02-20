import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountCode } from './entities/discount_codes.entity';
import { DiscountService } from './discountCode.service';
import { DiscountController } from './discountCode.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountCode])],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [DiscountService],
})
export class DiscountModule {}
