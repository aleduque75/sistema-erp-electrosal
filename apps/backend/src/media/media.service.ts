import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Media } from '@prisma/client';
import sharp from 'sharp';
import { join } from 'path';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async create(file: Express.Multer.File): Promise<Media> {
    const filePath = join(process.cwd(), file.path);
    const metadata = await sharp(filePath).metadata();

    return this.prisma.media.create({
      data: {
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`, // Caminho acessível via URL
        width: metadata.width,
        height: metadata.height,
      },
    });
  }

  async findAll(): Promise<Media[]> {
    return this.prisma.media.findMany();
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Mídia com ID ${id} não encontrada.`);
    }
    return media;
  }

  async remove(id: string): Promise<Media> {
    // TODO: Implementar a exclusão física do arquivo do sistema de arquivos
    const media = await this.findOne(id); // Garante que a mídia existe
    return this.prisma.media.delete({ where: { id } });
  }
}
