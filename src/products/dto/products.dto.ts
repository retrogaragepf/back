import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Product name is required.' })
  @IsString({ message: 'Product name must be a string.' })
  @ApiProperty({
    description: 'Name of the product. Must be a non-empty string.',
    example: 'Shaving Cream',
  })
  title: string;

  @IsNotEmpty({ message: 'Product description is required.' })
  @IsString({ message: 'Product description must be a string.' })
  @ApiProperty({
    description: 'Description of the product.',
    example: 'A soothing shaving cream for sensitive skin.',
  })
  description: string;

  @Type(() => Number)
  @IsNotEmpty({ message: 'Product price is required.' })
  @IsNumber({}, { message: 'Price must be a number.' })
  @IsPositive({ message: 'Price must be a positive number.' })
  @ApiProperty({
    description: 'Price of the product. Must be a positive number.',
    example: 19.99,
  })
  price: number;

  @Type(() => Number)
  @IsNotEmpty({ message: 'Product stock is required.' })
  @IsNumber({}, { message: 'Stock must be a number.' })
  @Min(0, { message: 'Stock must be zero or greater.' })
  @ApiProperty({
    description: 'Available stock of the product. Must be zero or more.',
    example: 100,
  })
  stock: number;

  @IsUUID()
  @ApiProperty({
    example: '44955e75-e13f-4c34-90b0-fc5f818ab781',
  })
  erasId: string;

  @IsNotEmpty({ message: 'Category ID is required.' })
  @IsUUID('4', { message: 'Category ID must be a valid UUID.' })
  @ApiProperty({
    description: 'UUID of the product category.',
    example: '0ee8f77a-f74e-4b19-871c-f4a89d37352f',
  })
  categoryId: string;
}
