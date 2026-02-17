import { Media as PrismaMedia } from '@prisma/client';
import {
  Media,
  MediaProps,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';

export class MediaMapper {
  public static toDomain(prismaMedia: PrismaMedia): Media {
    const props: MediaProps = {
      filename: prismaMedia.filename,
      mimetype: prismaMedia.mimetype,
      size: prismaMedia.size,
      path: prismaMedia.path,
      width: prismaMedia.width ?? undefined,
      height: prismaMedia.height ?? undefined,
      organizationId: prismaMedia.organizationId ?? undefined,
      createdAt: prismaMedia.createdAt,
      updatedAt: prismaMedia.updatedAt,
      recoveryOrderId: prismaMedia.recoveryOrderId ?? undefined,
      analiseQuimicaId: prismaMedia.analiseQuimicaId ?? undefined,
      transacaoId: prismaMedia.transacaoId ?? undefined,
      chemicalReactionId: prismaMedia.chemicalReactionId ?? undefined,
    };

    // ✅ UniqueEntityID.create garante que o ID do banco seja o ID da entidade
    return Media.create(props, UniqueEntityID.create(prismaMedia.id));
  }

  public static toPersistence(media: Media): PrismaMedia {
    // ✅ Mapeamento explícito para o Prisma garantir que o ID não vá como objeto
    return {
      id: media.id.toString(), // Converte UniqueEntityID para string
      filename: media.filename,
      mimetype: media.mimetype,
      size: media.size,
      path: media.path,
      width: media.width ?? null,
      height: media.height ?? null,
      organizationId: media.organizationId ?? null,
      createdAt: media.createdAt || new Date(),
      updatedAt: new Date(),
      recoveryOrderId: media.recoveryOrderId ?? null,
      analiseQuimicaId: media.analiseQuimicaId ?? null,
      transacaoId: media.transacaoId ?? null,
      chemicalReactionId: media.chemicalReactionId ?? null,
    };
  }
}
