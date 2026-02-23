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
  Query,
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
    const medias = await this.mediaService.findAll();
    return medias.map(m => ({
      ...(m as any).props,
      id: m.id.toString(),
      url: (m as any).url
    }));
  }

  @Get('analise-quimica/:id')
  async findByAnaliseQuimicaId(@Param('id') id: string) {
    const medias = await this.mediaService.findByAnaliseQuimicaId(id);
    return medias.map(m => ({
      ...(m as any).props,
      id: m.id.toString(),
      url: (m as any).url
    }));
  }

  @Get('recovery-order/:id')
  async findByRecoveryOrderId(@Param('id') id: string) {
    const medias = await this.mediaService.findByRecoveryOrderId(id);
    return medias.map(m => ({
      ...(m as any).props,
      id: m.id.toString(),
      url: (m as any).url
    }));
  }

  @Get('chemical-reaction/:id')
  async findByChemicalReactionId(@Param('id') id: string) {
    const medias = await this.mediaService.findByChemicalReactionId(id);
    return medias.map(m => ({
      ...(m as any).props,
      id: m.id.toString(),
      url: (m as any).url
    }));
  }

  @Get('transacao/:id')
  async findByTransacaoId(@Param('id') id: string) {
    const medias = await this.mediaService.findByTransacaoId(id);
    return medias.map(m => ({
      ...(m as any).props,
      id: m.id.toString(),
      url: (m as any).url
    }));
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Query('analiseQuimicaId') analiseQuimicaId?: string,
    @Query('recoveryOrderId') recoveryOrderId?: string,
    @Query('transacaoId') transacaoId?: string,
    @Query('chemicalReactionId') chemicalReactionId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const organizationId =
      (req.user as any)?.organizationId || (req.user as any)?.orgId;

    if (!organizationId) {
      throw new BadRequestException('ID da organização ausente no token.');
    }

    const media = await this.mediaService.create(file, organizationId, {
      analiseQuimicaId,
      recoveryOrderId,
      transacaoId,
      chemicalReactionId,
    });

    return {
      message: 'Arquivo enviado com sucesso!',
      media: {
        ... (media as any).props,
        id: media.id.toString(),
        url: (media as any).url
      }
    };
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