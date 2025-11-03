import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  UseGuards,
  Param,
  Query,
  Req,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaResponseDto } from './dtos/media.response.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, 
    @Req() req, 
    @Query('recoveryOrderId') recoveryOrderId?: string, 
    @Query('analiseQuimicaId') analiseQuimicaId?: string,
    @Query('transacaoId') transacaoId?: string, // Adicionar transacaoId
  ): Promise<MediaResponseDto> { // Adicionar MediaResponseDto
    const organizationId = req.user?.orgId;
    const newMedia = await this.mediaService.create(file, organizationId, recoveryOrderId, analiseQuimicaId, transacaoId); // Passar transacaoId
    return MediaResponseDto.fromDomain(newMedia); // Usar o DTO
  }

  @Get('analise-quimica/:analiseQuimicaId')
  async findMediaByAnaliseQuimicaId(@Req() req, @Param('analiseQuimicaId') analiseQuimicaId: string): Promise<MediaResponseDto[]> {
    const organizationId = req.user?.orgId;
    const media = await this.mediaService.findByAnaliseQuimicaId(analiseQuimicaId, organizationId);
    return MediaResponseDto.fromDomainArray(media);
  }

  @Get('recovery-order/:recoveryOrderId')
  async findMediaByRecoveryOrderId(@Req() req, @Param('recoveryOrderId') recoveryOrderId: string): Promise<MediaResponseDto[]> {
    const organizationId = req.user?.orgId;
    const media = await this.mediaService.findByRecoveryOrderId(recoveryOrderId, organizationId);
    return MediaResponseDto.fromDomainArray(media);
  }

  @Delete(':id')
  async removeMedia(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }
}
