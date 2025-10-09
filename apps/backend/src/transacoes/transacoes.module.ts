import { Module } from '@nestjs/common';
import { TransacoesService } from './transacoes.service';
import { TransacoesController } from './transacoes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { UpdateTransactionUseCase } from './use-cases/update-transaction.use-case';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [TransacoesController],
  providers: [TransacoesService, UpdateTransactionUseCase],
  exports: [TransacoesService],
})
export class TransacoesModule {}
