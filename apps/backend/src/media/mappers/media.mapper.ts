import { Media as PrismaMedia } from '@prisma/client';
import { Media, MediaProps, UniqueEntityID } from '@sistema-erp-electrosal/core';

export class MediaMapper {
  public static toDomain(prismaMedia: PrismaMedia): Media {
    const props: MediaProps = {
      filename: prismaMedia.filename,
      mimetype: prismaMedia.mimetype,
      size: prismaMedia.size,
      path: prismaMedia.path,
      width: prismaMedia.width,
      height: prismaMedia.height,
      organizationId: prismaMedia.organizationId,
      createdAt: prismaMedia.createdAt,
      updatedAt: prismaMedia.updatedAt,
    };
    return Media.create(props, new UniqueEntityID(prismaMedia.id));
  }

  public static toPersistence(media: Media): Omit<PrismaMedia, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } {
    return {
      id: media.id.toString(),
      filename: media.filename,
      mimetype: media.mimetype,
      size: media.size,
      path: media.path,
      width: media.width,
      height: media.height,
      organizationId: media.organizationId,
      recoveryOrderId: media.recoveryOrderId,
    };
  }
}