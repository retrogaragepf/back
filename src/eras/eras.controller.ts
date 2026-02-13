import { Controller, Get } from '@nestjs/common';
import { ErasService } from './eras.service';

@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}

  @Get('seeder')
  seeder() {
    return this.erasService.seeder();
  }
}
