import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GenerateNextNumberUseCase } from './use-cases/generate-next-number.use-case';
import { EntityCounterService } from './services/entity-counter.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService, GenerateNextNumberUseCase, EntityCounterService],
  exports: [AuditLogService, GenerateNextNumberUseCase, EntityCounterService],
})
export class CommonModule {}
