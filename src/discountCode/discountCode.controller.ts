import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DiscountService } from './discountCode.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../users/roles.enum';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  // 👑 Solo admin crea
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post()
  create(@Body() dto: CreateDiscountDto) {
    return this.discountService.create(dto);
  }

  // 👑 Solo admin ve todos
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get()
  findAll() {
    return this.discountService.findAll();
  }

  // 👑 Solo admin desactiva
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.discountService.deactivate(id);
  }
}
