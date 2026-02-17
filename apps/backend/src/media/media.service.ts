import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Media, MediaProps } from '@sistema-erp-electrosal/core';
import { MediaMapper } from './mappers/media.mapper';
import * as sharp from 'sharp';
import { join } from 'path';
import * as fs from 'fs';

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
      path: `/uploads/${file.filename}`,
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

    return MediaMapper.toDomain(prismaMedia);
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

  async findAll(): Promise<Media[]> {
    const prismaMedia = await this.prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return prismaMedia.map(MediaMapper.toDomain);
  }

  async findOne(id: string): Promise<Media> {
    const prismaMedia = await this.prisma.media.findUnique({ where: { id } });
    if (!prismaMedia)
      throw new NotFoundException(`Mídia ${id} não encontrada.`);
    return MediaMapper.toDomain(prismaMedia);
  }

  async remove(id: string): Promise<Media> {
    const mediaToDelete = await this.findOne(id); // Obtém a mídia antes de deletar do banco

    // Extrai o nome do arquivo
    const filename = (mediaToDelete as any).props?.filename || (mediaToDelete as any).filename;

    if (filename) {
      const filePath = join(process.cwd(), 'uploads', filename);
      try {
        if (fs.existsSync(filePath)) { // Verifica se o arquivo existe antes de tentar deletar
          fs.unlinkSync(filePath);
          console.log(`Arquivo ${filename} removido do sistema de arquivos.`);
        } else {
          console.warn(`Tentativa de remover arquivo inexistente: ${filePath}`);
        }
      } catch (error) {
        console.error(`Erro ao remover o arquivo físico ${filename}:`, error.message);
        // Dependendo da criticidade, pode-se lançar uma exceção ou apenas logar o erro
      }
    }

    const deleted = await this.prisma.media.delete({ where: { id } });
    return MediaMapper.toDomain(deleted);
  }
}
