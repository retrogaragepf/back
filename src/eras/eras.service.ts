import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Eras } from './entities/era.entity';

@Injectable()
export class ErasService {
  constructor(
    @InjectRepository(Eras)
    private readonly erasRepository: Repository<Eras>,
  ) {}

  //  Obtener todas las eras
  async getEras(): Promise<Eras[]> {
    return this.erasRepository.find({
      order: { name: 'ASC' },
    });
  }

  //  Crear una sola era
  async createEra(name: string): Promise<Eras> {
    const existing = await this.erasRepository.findOne({
      where: { name },
    });

    if (existing) {
      throw new BadRequestException('Era already exists');
    }

    const era = this.erasRepository.create({ name });
    return this.erasRepository.save(era);
  }

  //  Agregar múltiples eras (ideal para seeder)
  async addEras(eras: { name: string }[]): Promise<Eras[]> {
    const names = eras.map((e) => e.name);

    // Buscar cuáles ya existen
    const existing = await this.erasRepository.find({
      where: { name: In(names) },
    });

    const existingNames = existing.map((e) => e.name);

    // Filtrar solo las que no existen
    const newEras = eras.filter((era) => !existingNames.includes(era.name));

    if (!newEras.length) return existing;

    const created = this.erasRepository.create(newEras);
    return this.erasRepository.save(created);
  }
}
