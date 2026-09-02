import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { MediaModule } from '../media/media.module';
import { SalesModule } from '../sales/sales.module';
import { TransacoesController } from './transacoes.controller';
import { TransacoesService } from './transacoes.service';
import { TransacaoRepository } from './repositories/transacao.repository';
import { PrismaTransacaoRepository } from './repositories/prisma-transacao.repository';
import { CreateTransacaoUseCase } from './use-cases/create-transacao.use-case';
import { CreateTransferUseCase } from './use-cases/create-transfer.use-case';
import { UpdateTransacaoUseCase } from './use-cases/update-transacao.use-case';
import { DeleteTransacaoUseCase } from './use-cases/delete-transacao.use-case';
import { ListTransacoesUseCase } from './use-cases/list-transacoes.use-case';
import { GetTransacaoUseCase } from './use-cases/get-transacao.use-case';
import { FindUnlinkedTransacoesUseCase } from './use-cases/find-unlinked-transacoes.use-case';
import { LinkAccountUseCase } from './use-cases/link-account.use-case';
import { BulkCreateTransacoesUseCase } from './use-cases/bulk-create-transacoes.use-case';
import { BulkUpdateTransacoesUseCase } from './use-cases/bulk-update-transacoes.use-case';
import { UpdateTransactionUseCase } from './use-cases/update-transaction.use-case';

@Module({
  imports: [PrismaModule, CommonModule, MediaModule, SalesModule],
  controllers: [TransacoesController],
  providers: [
    {
      provide: TransacaoRepository,
      useClass: PrismaTransacaoRepository,
    },
    CreateTransacaoUseCase,
    CreateTransferUseCase,
    UpdateTransacaoUseCase,
    DeleteTransacaoUseCase,
    ListTransacoesUseCase,
    GetTransacaoUseCase,
    FindUnlinkedTransacoesUseCase,
    LinkAccountUseCase,
    BulkCreateTransacoesUseCase,
    BulkUpdateTransacoesUseCase,
    UpdateTransactionUseCase,
    TransacoesService,
  ],
  exports: [
    TransacaoRepository,
    CreateTransacaoUseCase,
    CreateTransferUseCase,
    UpdateTransacaoUseCase,
    DeleteTransacaoUseCase,
    ListTransacoesUseCase,
    GetTransacaoUseCase,
    FindUnlinkedTransacoesUseCase,
    LinkAccountUseCase,
    BulkCreateTransacoesUseCase,
    BulkUpdateTransacoesUseCase,
    UpdateTransactionUseCase,
    TransacoesService,
  ],
})
export class TransacoesModule {}
