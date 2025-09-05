import { Media } from '@sistema-beleza/core';
import { Media as PrismaMedia } from '@prisma/client';

export class MediaMapper {
  static toDomain(raw: PrismaMedia): Media {
    return Media.create(
      {
        organizationId: raw.organizationId ?? undefined,
        filename: raw.filename,
        mimetype: raw.mimetype,
        size: raw.size,
        path: raw.path,
        width: raw.width ?? undefined,
        height: raw.height ?? undefined,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(media: Media): PrismaMedia {
    return {
      id: media.id.toString(),
      organizationId: media.organizationId ?? null,
      filename: media.filename,
      mimetype: media.mimetype,
      size: media.size,
      path: media.path,
      width: media.width ?? null,
      height: media.height ?? null,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      // landingPageLogos: [], // Relations are handled by Prisma, not directly mapped here
    } as PrismaMedia; // Cast to PrismaMedia to satisfy type checking
  }
}
