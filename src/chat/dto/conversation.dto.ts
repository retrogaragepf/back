import { IsEnum, IsArray, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsEnum(['PRIVATE', 'SUPPORT'])
  type: 'PRIVATE' | 'SUPPORT';

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}
