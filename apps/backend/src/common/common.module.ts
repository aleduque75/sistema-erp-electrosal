import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuditLogService } from './audit-log.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GenerateNextNumberUseCase } from './use-cases/generate-next-number.use-case';
import { EntityCounterService } from './services/entity-counter.service';
import { OfxImportService } from './services/ofx-import.service';
import { AIClassificationService } from './services/ai-classification.service';
import { OfxImportController } from './controllers/ofx-import.controller';

@Global()
@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [OfxImportController],
  providers: [
    AuditLogService, 
    GenerateNextNumberUseCase, 
    EntityCounterService,
    OfxImportService,
    AIClassificationService
  ],
  exports: [
    AuditLogService, 
    GenerateNextNumberUseCase, 
    EntityCounterService,
    OfxImportService,
    AIClassificationService
  ],
})
export class CommonModule {}
