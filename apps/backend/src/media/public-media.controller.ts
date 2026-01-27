import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { MediaService } from './media.service';

@Controller('public-media') // New controller for public media
export class PublicMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':id')
  async serveMedia(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const media = await this.mediaService.findOne(id);
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    const filePath = join(process.cwd(), 'uploads', media.path.split('/').pop() || ''); // Assuming path is like /uploads/filename.ext
    res.type(media.mimetype); // Set the correct content type
    return new StreamableFile(createReadStream(filePath)); // Use StreamableFile for efficient streaming
  }
}
