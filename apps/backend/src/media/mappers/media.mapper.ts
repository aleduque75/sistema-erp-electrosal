import { Media as PrismaMedia } from '@prisma/client';
import { Media, MediaProps, UniqueEntityID } from '@sistema-erp-electrosal/core';

export class MediaMapper {
  public static toDomain(prismaMedia: PrismaMedia): Media {
    console.log("Mapeando prismaMedia com path:", prismaMedia.path); // Adicionar este log
    const props: MediaProps = {
      filename: prismaMedia.filename,
      mimetype: prismaMedia.mimetype,
      size: prismaMedia.size,
      path: prismaMedia.path,
      width: prismaMedia.width,
      height: prismaMedia.height,
      organizationId: prismaMedia.organizationId,
      createdAt: prismaMedia.createdAt,
      updatedAt: prismaMedia.updatedAt, // Adicionado
      recoveryOrderId: prismaMedia.recoveryOrderId,
      analiseQuimicaId: prismaMedia.analiseQuimicaId, // Adicionado
      transacaoId: prismaMedia.transacaoId, // Adicionado
      chemicalReactionId: prismaMedia.chemicalReactionId, // Adicionado
    };
    return Media.create(props, UniqueEntityID.create(prismaMedia.id));
  }

  public static toPersistence(media: Media): Omit<PrismaMedia, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } {
    return {
      id: media.id.toString(),
      filename: media.filename,
      mimetype: media.mimetype,
      size: media.size,
      path: media.path,
      width: media.width ?? null, // Corrigido
      height: media.height ?? null, // Corrigido
      organizationId: media.organizationId ?? null, // Corrigido
      recoveryOrderId: media.recoveryOrderId ?? null, // Corrigido
      analiseQuimicaId: media.analiseQuimicaId ?? null, // Corrigido
      transacaoId: media.transacaoId ?? null, // Corrigido
      chemicalReactionId: media.chemicalReactionId ?? null, // Corrigido
    };
  }
}