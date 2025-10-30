import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IMediaRepository, Media, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { MediaMapper } from '../mappers/media.mapper';
import { Media as PrismaMedia } from '@prisma/client';

@Injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Media | null> {
    const prismaMedia = await this.prisma.media.findUnique({
      where: { id },
    });
    if (!prismaMedia) return null;
    return MediaMapper.toDomain(prismaMedia);
  }

  async create(media: Media): Promise<Media> {
    const data = MediaMapper.toPersistence(media);
    const prismaMedia = await this.prisma.media.create({ data });
    return MediaMapper.toDomain(prismaMedia);
  }
}
