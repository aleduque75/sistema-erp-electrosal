import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrismaModule } from '../prisma/prisma.module'; // ✅ 1. Importar o PrismaModule

@Module({
  imports: [PrismaModule], // ✅ 2. Adicionar o PrismaModule aos imports
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
