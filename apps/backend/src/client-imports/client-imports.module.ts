import { Module } from '@nestjs/common';
import { ClientImportsService } from './client-imports.service';
import { ClientImportsController } from './client-imports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Importa o PrismaModule
  controllers: [ClientImportsController],
  providers: [ClientImportsService],
})
export class ClientImportsModule {}
