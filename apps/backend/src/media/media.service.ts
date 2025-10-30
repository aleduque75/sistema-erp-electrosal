import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Media } from '@sistema-erp-electrosal/core'; // Changed // Changed
import { MediaMapper } from './mappers/media.mapper'; // Added
import * as sharp from 'sharp';
import { join } from 'path';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async create(file: Express.Multer.File, organizationId: string, recoveryOrderId?: string): Promise<Media> {
    const filePath = join(process.cwd(), file.path);
    const metadata = await sharp(filePath).metadata();

    const newMedia = Media.create({
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`, // Caminho acessível via URL
      width: metadata.width,
      height: metadata.height,
      organizationId: organizationId,
      recoveryOrderId: recoveryOrderId, // Associar à RecoveryOrder
    });

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
}
