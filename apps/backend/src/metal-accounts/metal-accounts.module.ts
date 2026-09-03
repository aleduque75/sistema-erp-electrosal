import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetalAccountsController } from './metal-accounts.controller';
import { PrismaMetalAccountRepository } from './repositories/prisma-metal-account.repository';
import { CreateMetalAccountUseCase } from './use-cases/create-metal-account.use-case';
import { FindMetalAccountByIdUseCase } from './use-cases/find-metal-account-by-id.use-case';
import { FindAllMetalAccountsUseCase } from './use-cases/find-all-metal-accounts.use-case';
import { PrismaMetalAccountEntryRepository } from './repositories/prisma-metal-account-entry.repository';
import { CreateMetalAccountEntryUseCase } from './use-cases/create-metal-account-entry.use-case';
import { FindAllMetalAccountEntriesUseCase } from './use-cases/find-all-metal-account-entries.use-case';
import { TransferFromSupplierAccountToPureMetalLotsUseCase } from './use-cases/transfer-from-supplier-account-to-pure-metal-lots.use-case';
import { QuotationsModule } from '../quotations/quotations.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';

@Module({
  imports: [QuotationsModule, PureMetalLotsModule],
  controllers: [MetalAccountsController],
  providers: [
    PrismaService,
    // Provedores de Repositório (Necessário para injeção por token)
    { provide: 'IMetalAccountRepository', useClass: PrismaMetalAccountRepository },
    { provide: 'IMetalAccountEntryRepository', useClass: PrismaMetalAccountEntryRepository },
    // Use Cases (Consumidores)
    CreateMetalAccountUseCase,
    FindMetalAccountByIdUseCase,
    FindAllMetalAccountsUseCase,
    CreateMetalAccountEntryUseCase,
    FindAllMetalAccountEntriesUseCase,
    TransferFromSupplierAccountToPureMetalLotsUseCase,
  ],
  exports: [
    // Exportamos os tokens de repositório para que outros módulos os consumam
    { provide: 'IMetalAccountRepository', useClass: PrismaMetalAccountRepository },
    { provide: 'IMetalAccountEntryRepository', useClass: PrismaMetalAccountEntryRepository },
    // Exportamos os Use Cases/Services que podem ser injetados diretamente
    CreateMetalAccountUseCase,
    CreateMetalAccountEntryUseCase,
    FindAllMetalAccountsUseCase,
    FindAllMetalAccountEntriesUseCase,
  ],
})
export class MetalAccountsModule {}