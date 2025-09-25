import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { QuotationImportsService } from './quotation-imports.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('quotation-imports')
export class QuotationImportsController {
  constructor(private readonly quotationImportsService: QuotationImportsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async importQuotations(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('orgId') organizationId: string,
  ) {
    if (!file) {
      throw new Error('No file uploaded.');
    }
    return this.quotationImportsService.importQuotationsFromJson(file.buffer, organizationId);
  }
}
