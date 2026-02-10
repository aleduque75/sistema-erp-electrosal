import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Media, MediaProps } from '@sistema-erp-electrosal/core';
import { MediaMapper } from './mappers/media.mapper';
import * as sharp from 'sharp';
import { join } from 'path';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async create(
    file: Express.Multer.File,
    organizationId: string,
    recoveryOrderId?: string,
    analiseQuimicaId?: string,
    transacaoId?: string,
    chemicalReactionId?: string,
  ): Promise<Media> {
    const filePath = join(process.cwd(), file.path);
    const metadata = await sharp(filePath).metadata();

    const mediaData: Omit<MediaProps, 'createdAt' | 'updatedAt'> = {
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
      width: metadata.width,
      height: metadata.height,
      organizationId: organizationId,
      recoveryOrderId: recoveryOrderId,
      analiseQuimicaId: analiseQuimicaId,
      chemicalReactionId: chemicalReactionId,
    };

    if (transacaoId && transacaoId !== 'temp') {
      mediaData.transacaoId = transacaoId;
    }

    const newMedia = Media.create(mediaData);

    const prismaMedia = await this.prisma.media.create({
      data: MediaMapper.toPersistence(newMedia),
    });
    return MediaMapper.toDomain(prismaMedia);
  }

  async findAll(): Promise<Media[]> {
    const prismaMedia = await this.prisma.media.findMany();
    return prismaMedia.map(MediaMapper.toDomain);
  }

  async findOne(id: string): Promise<Media> {
    const prismaMedia = await this.prisma.media.findUnique({ where: { id } });
    if (!prismaMedia) {
      throw new NotFoundException(`Mídia com ID ${id} não encontrada.`);
    }
    return MediaMapper.toDomain(prismaMedia);
  }

  async remove(id: string): Promise<Media> {
    // TODO: Implementar a exclusão física do arquivo do sistema de arquivos
    const media = await this.findOne(id); // Garante que a mídia existe e retorna DDD entity
    const deletedPrismaMedia = await this.prisma.media.delete({ where: { id } });
    return MediaMapper.toDomain(deletedPrismaMedia);
  }

  async findByAnaliseQuimicaId(analiseQuimicaId: string, organizationId: string): Promise<Media[]> {
    const prismaMedia = await this.prisma.media.findMany({
      where: { analiseQuimicaId, organizationId },
    });
    return prismaMedia.map(MediaMapper.toDomain);
  }

  async findByRecoveryOrderId(recoveryOrderId: string, organizationId: string): Promise<Media[]> {
    const prismaMedia = await this.prisma.media.findMany({
      where: { recoveryOrderId, organizationId },
    });
    return prismaMedia.map(MediaMapper.toDomain);
  }

  async associateMediaWithTransacao(
    transacaoId: string,
    mediaIds: string[],
    organizationId: string,
    tx?: any,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    await prisma.media.updateMany({
      where: {
        id: {
          in: mediaIds,
        },
        organizationId,
      },
      data: {
        transacaoId,
      },
    });
  }

  async removeByAnaliseQuimicaId(analiseQuimicaId: string, organizationId: string): Promise<void> {
    // TODO: Implementar a exclusão física dos arquivos do sistema de arquivos
    await this.prisma.media.deleteMany({
      where: { analiseQuimicaId, organizationId },
    });
  }
}
