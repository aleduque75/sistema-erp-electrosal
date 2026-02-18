import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { MediaService } from './media.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('/')
  async findAll() {
    return this.mediaService.findAll();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const organizationId =
      (req.user as any)?.organizationId || (req.user as any)?.orgId;

    if (!organizationId) {
      throw new BadRequestException(
        'Usuário não autenticado ou ID da organização ausente.',
      );
    }
    const media = await this.mediaService.create(file, organizationId);
    return { message: 'Arquivo enviado com sucesso!', media };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.mediaService.remove(id);
    return { statusCode: HttpStatus.NO_CONTENT, message: 'Mídia removida com sucesso.' };
  }

  @Public()
  @Get('public-media/:id')
  async getMedia(@Param('id') id: string, @Res() res: Response) {
    try {
      // 1. Validação básica
      if (!id || id === 'undefined' || id.includes('object')) {
        return res.status(400).json({ message: 'ID de mídia inválido' });
      }

      // 2. Busca no Banco
      const media = await this.mediaService.findOne(id);
      if (!media) {
        return res.status(404).json({ message: 'Mídia não encontrada no banco de dados' });
      }

      // 3. Extração do Filename (ajustado para padrão DDD/Prisma)
      const filename = (media as any).props?.filename || (media as any).filename;
      
      if (!filename) {
        return res.status(500).json({ message: 'Erro: Nome do arquivo não registrado na mídia' });
      }

      // 4. Caminho do arquivo (Garante que olha na raiz/uploads)
      const filePath = join(process.cwd(), 'uploads', filename);

      // 5. Verifica se o arquivo existe fisicamente
      if (!existsSync(filePath)) {
        console.error(`[ERRO 404] Arquivo não encontrado no disco: ${filePath}`);
        return res.status(404).json({ message: 'Arquivo físico não encontrado na pasta uploads' });
      }

      // 6. Envia o arquivo
      return res.sendFile(filePath);

    } catch (error) {
      console.error('[ERRO 500] Falha ao buscar mídia:', error.message);
      return res.status(500).json({ 
        message: 'Erro interno ao processar a imagem',
        error: error.message 
      });
    }
  }
}