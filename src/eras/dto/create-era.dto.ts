import { ApiProperty } from '@nestjs/swagger';

export class CreateEraDto {
  @ApiProperty({ example: 'Década del 80' })
  name: string;
}
