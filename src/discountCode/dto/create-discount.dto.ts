import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateDiscountDto {
  @IsInt()
  @Min(1)
  @Max(90)
  percentage: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;
}
