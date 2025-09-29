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

@Module({
  controllers: [MetalAccountsController],
  providers: [
    PrismaService,
    { provide: 'IMetalAccountRepository', useClass: PrismaMetalAccountRepository },
    { provide: 'IMetalAccountEntryRepository', useClass: PrismaMetalAccountEntryRepository },
    CreateMetalAccountUseCase,
    FindMetalAccountByIdUseCase,
    FindAllMetalAccountsUseCase,
    CreateMetalAccountEntryUseCase,
    FindAllMetalAccountEntriesUseCase,
  ],
  exports: [
    { provide: 'IMetalAccountRepository', useClass: PrismaMetalAccountRepository },
    { provide: 'IMetalAccountEntryRepository', useClass: PrismaMetalAccountEntryRepository },
    CreateMetalAccountEntryUseCase,
    FindAllMetalAccountsUseCase,
    FindAllMetalAccountEntriesUseCase,
  ],
})
export class MetalAccountsModule {}
