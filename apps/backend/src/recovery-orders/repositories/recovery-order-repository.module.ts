import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaRecoveryOrderRepository } from './prisma-recovery-order.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'IRecoveryOrderRepository',
      useClass: PrismaRecoveryOrderRepository,
    },
  ],
  exports: ['IRecoveryOrderRepository'],
})
export class RecoveryOrderRepositoryModule {}
