import { Media } from './media.entity';

export interface IMediaRepository {
  findById(id: string): Promise<Media | null>;
  create(media: Media): Promise<Media>;
  // Add other methods if needed
}
