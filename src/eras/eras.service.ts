import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Eras } from './entities/era.entity';
import { Repository } from 'typeorm';
import * as data from '../data.json';

@Injectable()
export class ErasService {
  constructor(
    @InjectRepository(Eras)
    private readonly erasRepository: Repository<Eras>,
  ) {}
  async seeder() {
    const eras = new Set(data.map((item) => item.era));
    const erasArray = Array.from(eras);
    const erasData = erasArray.map((era) => ({
      name: era,
    }));

    await this.erasRepository.upsert(erasData, ['name']);

    return 'Eras Seeded Successfully';
  }
}
