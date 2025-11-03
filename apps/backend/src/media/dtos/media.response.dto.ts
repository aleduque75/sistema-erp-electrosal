import { Media } from '@sistema-erp-electrosal/core';

export class MediaResponseDto {
  id: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
  recoveryOrderId?: string;
  analiseQuimicaId?: string;

  static fromDomain(media: Media): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = media.id.toString();
    dto.filename = media.filename;
    dto.path = media.path;
    dto.mimetype = media.mimetype;
    dto.size = media.size;
    dto.width = media.width;
    dto.height = media.height;
    dto.recoveryOrderId = media.recoveryOrderId;
    dto.analiseQuimicaId = media.analiseQuimicaId;
    return dto;
  }

  static fromDomainArray(mediaArray: Media[]): MediaResponseDto[] {
    return mediaArray.map(media => this.fromDomain(media));
  }
}
