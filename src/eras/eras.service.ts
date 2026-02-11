import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Eras } from './entities/era.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ErasService {
  constructor(
    @InjectRepository(Eras)
    private readonly erasRepository: Repository<Eras>,
  ) {}
}
