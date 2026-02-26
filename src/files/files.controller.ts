import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly cloudinaryService: FilesService) {}

  @Post('upload-image/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir imagen de producto',
    description:
      'Permite subir o actualizar la imagen de un producto. Solo acepta JPG, JPEG, PNG o WEBP con tamaño máximo de 200KB.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del producto',
    example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Imagen subida correctamente',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado',
  })
  upLoadFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 200000,
            message: 'The file must be less than 200kb',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.cloudinaryService.updateProductImage(id, file);
  }
}
