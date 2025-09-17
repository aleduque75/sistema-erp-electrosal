import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContasMetaisController } from './contas-metais.controller';
import { PrismaContaMetalRepository } from './repositories/prisma-conta-metal.repository';
import { CreateContaMetalUseCase } from './use-cases/create-conta-metal.use-case';
import { FindContaMetalByIdUseCase } from './use-cases/find-conta-metal-by-id.use-case';
import { FindContaMetalByNameAndMetalTypeUseCase } from './use-cases/find-conta-metal-by-name-and-metal-type.use-case';
import { UpdateContaMetalBalanceUseCase } from './use-cases/update-conta-metal-balance.use-case';
import { FindAllContasMetaisUseCase } from './use-cases/find-all-contas-metais.use-case'; // ADDED

@Module({
  controllers: [ContasMetaisController],
  providers: [
    PrismaService,
    { provide: 'IContaMetalRepository', useClass: PrismaContaMetalRepository },
    CreateContaMetalUseCase,
    FindContaMetalByIdUseCase,
    FindContaMetalByNameAndMetalTypeUseCase,
    UpdateContaMetalBalanceUseCase,
    FindAllContasMetaisUseCase, // ADDED
  ],
  exports: [
    { provide: 'IContaMetalRepository', useClass: PrismaContaMetalRepository },
    FindContaMetalByNameAndMetalTypeUseCase,
    UpdateContaMetalBalanceUseCase,
    FindAllContasMetaisUseCase, // ADDED
  ], // Exportar para que outros módulos possam usar
})
export class ContasMetaisModule {}
