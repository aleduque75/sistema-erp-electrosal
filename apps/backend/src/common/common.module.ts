import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GenerateNextNumberUseCase } from './use-cases/generate-next-number.use-case';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService, GenerateNextNumberUseCase],
  exports: [AuditLogService, GenerateNextNumberUseCase],
})
export class CommonModule {}
