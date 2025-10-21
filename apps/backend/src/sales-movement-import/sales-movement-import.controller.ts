import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SalesMovementImportUseCase } from './sales-movement-import.use-case';

@Controller('sales-movement-import')
export class SalesMovementImportController {
  constructor(private readonly importUseCase: SalesMovementImportUseCase) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    // We will pass the file buffer to the use case to process
    return this.importUseCase.execute(file.buffer);
  }
}
