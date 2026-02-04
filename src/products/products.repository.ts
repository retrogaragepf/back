import { Injectable } from '@nestjs/common';

export type Product = {
  id: string;
};
export const products: Product[] = [
  {
    id: '1',
  },
];

@Injectable()
export class ProductsRepository {
  getAllProducts() {
    return products;
  }
}
