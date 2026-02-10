import { Media } from '@sistema-erp-electrosal/core';

export class MediaResponseDto {
  id: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  width?: number | null;
  height?: number | null;
  recoveryOrderId?: string | null;
  analiseQuimicaId?: string | null;

  static fromDomain(media: Media): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = media.id.toString();
    dto.filename = media.filename;
    dto.path = media.path;
    dto.mimetype = media.mimetype;
    dto.size = media.size;
    dto.width = media.width ?? null;
    dto.height = media.height ?? null;
    dto.recoveryOrderId = media.recoveryOrderId ?? null;
    dto.analiseQuimicaId = media.analiseQuimicaId ?? null;
    return dto;
  }

  static fromDomainArray(mediaArray: Media[]): MediaResponseDto[] {
    return mediaArray.map(media => this.fromDomain(media));
  }
}
