import { Media } from './media.entity';

export interface IMediaRepository {
  findById(id: string): Promise<Media | null>;
  findByRecoveryOrderId(recoveryOrderId: string): Promise<Media[]>;
  create(media: Media): Promise<Media>;
  save(media: Media): Promise<Media>;
}
