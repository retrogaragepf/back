import { Injectable, OnModuleInit } from '@nestjs/common';
import { CategoriesService } from 'src/categories/categories.service';
import { ErasService } from 'src/eras/eras.service';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly erasService: ErasService,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
    await this.seedEras();
  }

  private async seedCategories() {
    const existing = await this.categoriesService.getCategories();
    if (existing.length) return;

    await this.categoriesService.addCategories([
      { name: 'Ropa & Accesorios' },
      { name: 'Tecnología Retro' },
      { name: 'Decoración & Hogar' },
      { name: 'Coleccionables' },
      { name: 'Autos & Garaje' },
      { name: 'Muebles Antiguos' },
    ]);

    console.log('✅ Categorías vintage creadas');
  }

  private async seedEras() {
    const existing = await this.erasService.getEras();
    if (existing.length) return;

    await this.erasService.addEras([
      { name: '60s' },
      { name: '70s' },
      { name: '80s' },
      { name: '90s' },
      { name: 'Y2K' },
    ]);
  }
}
