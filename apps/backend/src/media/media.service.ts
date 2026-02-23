import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Media, MediaProps } from '@sistema-erp-electrosal/core';
import { MediaMapper } from './mappers/media.mapper';
import * as sharp from 'sharp';
import { join } from 'path';
import * as fs from 'fs';
import { S3Service } from '../shared/storage/s3.service';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) { }

  /**
   * Monta a URL pública: Prioriza a URL do S3 se salva, senão usa o gateway local
   */
  private getFullUrl(item: any): string {
    if (item.path && item.path.startsWith('http')) {
      return item.path;
    }
    const baseUrl = process.env.API_URL || '';
    return `${baseUrl}/api/media/public-media/${item.id}`;
  }

  async create(
    file: Express.Multer.File,
    organizationId: string,
    associations?: {
      analiseQuimicaId?: string;
      recoveryOrderId?: string;
      transacaoId?: string;
      chemicalReactionId?: string;
    },
  ): Promise<Media> {
    let uploadBuffer = file.buffer;
    let uploadSize = file.size;

    // Se for imagem, otimizar
    if (file.mimetype.startsWith('image/')) {
      try {
        const optimized = await sharp(file.buffer)
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();

        uploadBuffer = optimized;
        uploadSize = optimized.length;
      } catch (error) {
        // Se falhar a otimização (ex: formato não suportado pelo sharp), envia o original
        console.error('Erro ao otimizar imagem, enviando original:', error);
      }
    }

    // 1. Upload para o S3
    const s3Url = await this.s3Service.uploadFile({
      buffer: uploadBuffer,
      originalname: file.originalname,
      mimetype: file.mimetype.startsWith('image/') ? 'image/jpeg' : file.mimetype
    });

    // Extrair o filename único da URL do S3 para garantir unicidade no banco de dados
    const uniqueFilename = s3Url.split('/').pop() || file.originalname;

    const mediaData: Omit<MediaProps, 'createdAt' | 'updatedAt'> = {
      filename: uniqueFilename,
      mimetype: file.mimetype.startsWith('image/') ? 'image/jpeg' : file.mimetype,
      size: uploadSize,
      path: s3Url, // Agora salvamos a URL completa do S3 no campo path
      organizationId,
      ...associations,
    };

    const newMedia = Media.create(mediaData);
    const prismaMedia = await this.prisma.media.create({
      data: MediaMapper.toPersistence(newMedia),
    });

    const domainMedia = MediaMapper.toDomain(prismaMedia);
    (domainMedia as any).url = s3Url;

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
      (domain as any).url = this.getFullUrl(item);
      return domain;
    });
  }

  async findByRecoveryOrderId(recoveryOrderId: string): Promise<Media[]> {
    const prismaMedias = await this.prisma.media.findMany({
      where: { recoveryOrderId },
      orderBy: { createdAt: 'desc' }
    });
    return prismaMedias.map(item => {
      const domain = MediaMapper.toDomain(item);
      (domain as any).url = this.getFullUrl(item);
      return domain;
    });
  }

  async findByChemicalReactionId(chemicalReactionId: string): Promise<Media[]> {
    const prismaMedias = await this.prisma.media.findMany({
      where: { chemicalReactionId },
      orderBy: { createdAt: 'desc' }
    });
    return prismaMedias.map(item => {
      const domain = MediaMapper.toDomain(item);
      (domain as any).url = this.getFullUrl(item);
      return domain;
    });
  }

  async findByTransacaoId(transacaoId: string): Promise<Media[]> {
    const prismaMedias = await this.prisma.media.findMany({
      where: { transacaoId },
      orderBy: { createdAt: 'desc' }
    });
    return prismaMedias.map(item => {
      const domain = MediaMapper.toDomain(item);
      (domain as any).url = this.getFullUrl(item);
      return domain;
    });
  }

  async findAll(): Promise<Media[]> {
    const prismaMedia = await this.prisma.media.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return prismaMedia.map(item => {
      const domain = MediaMapper.toDomain(item);
      (domain as any).url = this.getFullUrl(item);
      return domain;
    });
  }

  async findOne(id: string): Promise<Media> {
    const prismaMedia = await this.prisma.media.findUnique({ where: { id } });
    if (!prismaMedia) throw new NotFoundException(`Mídia ${id} não encontrada.`);

    const domain = MediaMapper.toDomain(prismaMedia);
    (domain as any).url = this.getFullUrl(prismaMedia);
    return domain;
  }

  async remove(id: string): Promise<Media> {
    const mediaToDelete = await this.findOne(id);
    const itemPath = (mediaToDelete as any).props?.path || (mediaToDelete as any).path;

    if (itemPath && itemPath.startsWith('http')) {
      // Remover do S3
      await this.s3Service.deleteFile(itemPath);
    } else {
      // Remover local
      const filename = (mediaToDelete as any).props?.filename || (mediaToDelete as any).filename;
      if (filename) {
        const filePath = join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    const deleted = await this.prisma.media.delete({ where: { id } });
    return MediaMapper.toDomain(deleted);
  }
}