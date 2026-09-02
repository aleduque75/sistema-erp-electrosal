import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SalesMovementImportUseCase } from './sales-movement-import.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('sales-movement-import')
export class SalesMovementImportController {
  constructor(private readonly importUseCase: SalesMovementImportUseCase) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const organizationId = orgId || legacyOrgId;
    return this.importUseCase.execute(file.buffer, organizationId);
  }
}
