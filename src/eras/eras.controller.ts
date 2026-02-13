import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ErasService } from './eras.service';

@ApiTags('Eras')
@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}

  //  Obtener todas las eras
  @Get()
  getEras() {
    return this.erasService.getEras();
  }

  //  Crear una era (protegido)
  @Post()
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  createEra(@Body('name') name: string) {
    return this.erasService.createEra(name);
  }
}
