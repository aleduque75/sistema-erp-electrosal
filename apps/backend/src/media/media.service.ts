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
   * Monta a URL pública: /api/media/public-media/:id
   */
  private getFullUrl(id: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return `${baseUrl}/api/media/public-media/${id}`;
  }

  async create(
    file: Express.Multer.File,
    organizationId: string,
  ): Promise<Media> {
    const mediaData: Omit<MediaProps, 'createdAt' | 'updatedAt'> = {
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
      organizationId,
    };

    const newMedia = Media.create(mediaData);
    const prismaMedia = await this.prisma.media.create({
      data: MediaMapper.toPersistence(newMedia),
    });

    const domainMedia = MediaMapper.toDomain(prismaMedia);
    (domainMedia as any).url = this.getFullUrl(prismaMedia.id);

    return domainMedia;
  }

  // ✅ Método essencial para o TransacoesService e para o build passar
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

  async findByAnaliseQuimicaId(analiseQuimicaId: string): Promise<Media[]> {
    const prismaMedias = await this.prisma.media.findMany({
      where: { analiseQuimicaId },
      orderBy: { createdAt: 'desc' }
    });
    return prismaMedias.map(item => {
      const domain = MediaMapper.toDomain(item);
      (domain as any).url = this.getFullUrl(item.id);
      return domain;
    });
  }

  async findAll(): Promise<Media[]> {
    const prismaMedia = await this.prisma.media.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return prismaMedia.map(item => {
      const domain = MediaMapper.toDomain(item);
      (domain as any).url = this.getFullUrl(item.id);
      return domain;
    });
  }

  async findOne(id: string): Promise<Media> {
    const prismaMedia = await this.prisma.media.findUnique({ where: { id } });
    if (!prismaMedia) throw new NotFoundException(`Mídia ${id} não encontrada.`);

    const domain = MediaMapper.toDomain(prismaMedia);
    (domain as any).url = this.getFullUrl(prismaMedia.id);
    return domain;
  }

  async remove(id: string): Promise<Media> {
    const mediaToDelete = await this.findOne(id);
    const filename = (mediaToDelete as any).props?.filename || (mediaToDelete as any).filename;

    if (filename) {
      const filePath = join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const deleted = await this.prisma.media.delete({ where: { id } });
    return MediaMapper.toDomain(deleted);
  }
}