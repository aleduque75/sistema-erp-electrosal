import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Media, MediaProps } from '@sistema-erp-electrosal/core';
import { MediaMapper } from './mappers/media.mapper';
import * as sharp from 'sharp';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) { }

  /**
   * Ajuste Crítico: Monta a URL incluindo o prefixo global '/api' 
   * que foi definido no main.ts (app.setGlobalPrefix('api'))
   */
  private getFullUrl(path: string): string {
    const baseUrl = process.env.APP_URL || process.env.API_URL || 'https://dev-api.electrosal.com.br';

    // O path já vem do banco como '/uploads/arquivo.jpg'
    // Como o main.ts serve em '/api/uploads/', precisamos garantir essa estrutura
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}/api${cleanPath}`;
  }

  async create(
    file: Express.Multer.File,
    organizationId: string,
    recoveryOrderId?: string,
    analiseQuimicaId?: string,
    transacaoId?: string,
    chemicalReactionId?: string,
  ): Promise<Media> {
    const filePath = file.path;
    let width, height;

    try {
      const metadata = await sharp(filePath).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (error) {
      console.warn(`Erro metadados: ${file.filename}`, error.message);
    }

    const mediaData: Omit<MediaProps, 'createdAt' | 'updatedAt'> = {
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`, // Salvo assim no banco
      width,
      height,
      organizationId,
      recoveryOrderId,
      analiseQuimicaId,
      chemicalReactionId,
    };

    if (transacaoId && transacaoId !== 'temp') {
      mediaData.transacaoId = transacaoId;
    }

    const newMedia = Media.create(mediaData);
    const prismaMedia = await this.prisma.media.create({
      data: MediaMapper.toPersistence(newMedia),
    });

    const domainMedia = MediaMapper.toDomain(prismaMedia);

    // Injeta a URL correta: https://dev-api.electrosal.com.br/api/uploads/...
    (domainMedia as any).url = this.getFullUrl(prismaMedia.path);

    return domainMedia;
  }

  async findAll(): Promise<Media[]> {
    const prismaMedia = await this.prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return prismaMedia.map(item => {
      const domain = MediaMapper.toDomain(item);
      (domain as any).url = this.getFullUrl(item.path);
      return domain;
    });
  }

  async findOne(id: string): Promise<Media> {
    const prismaMedia = await this.prisma.media.findUnique({ where: { id } });
    if (!prismaMedia)
      throw new NotFoundException(`Mídia ${id} não encontrada.`);

    const domain = MediaMapper.toDomain(prismaMedia);
    (domain as any).url = this.getFullUrl(prismaMedia.path);

    return domain;
  }

  async associateMediaWithTransacao(
    transacaoId: string,
    mediaIds: string[],
    organizationId: string,
    tx?: any,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    await prisma.media.updateMany({
      where: { id: { in: mediaIds }, organizationId },
      data: { transacaoId },
    });
  }

  async remove(id: string): Promise<Media> {
    const mediaToDelete = await this.findOne(id);
    const filename = (mediaToDelete as any).props?.filename || (mediaToDelete as any).filename;

    if (filename) {
      const filePath = join(process.cwd(), 'uploads', filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Arquivo ${filename} removido do sistema de arquivos.`);
        }
      } catch (error) {
        console.error(`Erro ao remover o arquivo físico ${filename}:`, error.message);
      }
    }

    const deleted = await this.prisma.media.delete({ where: { id } });
    return MediaMapper.toDomain(deleted);
  }
}