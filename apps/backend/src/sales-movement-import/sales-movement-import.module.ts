import { Module } from '@nestjs/common';
import { SalesMovementImportController } from './sales-movement-import.controller';
import { SalesMovementImportUseCase } from './sales-movement-import.use-case';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SalesMovementImportController],
  providers: [SalesMovementImportUseCase],
  exports: [SalesMovementImportUseCase], // Adicionado para permitir a injeção em outros módulos
})
export class SalesMovementImportModule {}
