import { Controller } from '@nestjs/common';
import { ErasService } from './eras.service';

@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}
}
