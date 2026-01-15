import { Module } from '@nestjs/common';
import { TransacoesService } from './transacoes.service';
import { TransacoesController } from './transacoes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { UpdateTransactionUseCase } from './use-cases/update-transaction.use-case';
import { MediaModule } from '../media/media.module'; // Importar MediaModule
import { SalesModule } from '../sales/sales.module';
import { Decimal } from 'decimal.js';

@Module({
  imports: [PrismaModule, CommonModule, MediaModule, SalesModule], // Adicionar MediaModule e SalesModule
  controllers: [TransacoesController],
  providers: [TransacoesService, UpdateTransactionUseCase],
  exports: [TransacoesService],
})
export class TransacoesModule {}
