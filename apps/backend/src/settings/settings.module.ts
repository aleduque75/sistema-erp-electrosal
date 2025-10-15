import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ExportSeedDataUseCase } from './use-cases/export-seed-data.use-case'; // Importar o novo use case

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService, ExportSeedDataUseCase], // Adicionar o use case aos providers
  exports: [SettingsService],
})
export class SettingsModule {}
