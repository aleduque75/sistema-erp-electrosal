import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContasMetaisController } from './contas-metais.controller';
import { PrismaContaMetalRepository } from './repositories/prisma-conta-metal.repository';
import { CreateContaMetalUseCase } from './use-cases/create-conta-metal.use-case';
import { FindContaMetalByIdUseCase } from './use-cases/find-conta-metal-by-id.use-case';
import { FindAllContasMetaisUseCase } from './use-cases/find-all-contas-metais.use-case';
import { PrismaMetalAccountEntryRepository } from './repositories/prisma-metal-account-entry.repository';
import { CreateMetalAccountEntryUseCase } from './use-cases/create-metal-account-entry.use-case';

@Module({
  controllers: [ContasMetaisController],
  providers: [
    PrismaService,
    { provide: 'IContaMetalRepository', useClass: PrismaContaMetalRepository },
    { provide: 'IMetalAccountEntryRepository', useClass: PrismaMetalAccountEntryRepository },
    CreateContaMetalUseCase,
    FindContaMetalByIdUseCase,
    FindAllContasMetaisUseCase,
    CreateMetalAccountEntryUseCase,
  ],
  exports: [
    { provide: 'IContaMetalRepository', useClass: PrismaContaMetalRepository },
    { provide: 'IMetalAccountEntryRepository', useClass: PrismaMetalAccountEntryRepository },
    CreateMetalAccountEntryUseCase,
    FindAllContasMetaisUseCase,
  ],
})
export class ContasMetaisModule {}
