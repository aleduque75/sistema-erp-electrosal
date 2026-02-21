import {
  Controller,
  Get,
  Param,
  Res,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
  HttpStatus,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Get('/')
  async findAll() {
    return this.mediaService.findAll();
  }

  @Get('analise-quimica/:id')
  async findByAnaliseQuimicaId(@Param('id') id: string) {
    return this.mediaService.findByAnaliseQuimicaId(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const organizationId =
      (req.user as any)?.organizationId || (req.user as any)?.orgId;

    if (!organizationId) {
      throw new BadRequestException('ID da organização ausente no token.');
    }

    const media = await this.mediaService.create(file, organizationId);
    return { message: 'Arquivo enviado com sucesso!', media };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.mediaService.remove(id);
    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Mídia removida com sucesso.'
    };
  }
}