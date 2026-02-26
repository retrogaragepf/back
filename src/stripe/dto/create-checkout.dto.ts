import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CheckoutItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateCheckoutDto {
  @IsArray()
  @ApiProperty({ type: [CheckoutItemDto] })
  items: CheckoutItemDto[];

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  discountCode?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
