import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChemicalReactionsController } from './chemical-reactions.controller';
import { CreateChemicalReactionUseCase } from './use-cases/create-chemical-reaction.use-case';
import { PrismaChemicalReactionRepository } from './repositories/prisma-chemical-reaction.repository';
import { PrismaPureMetalLotRepository } from '../recovery-orders/repositories/prisma-pure-metal-lot.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ChemicalReactionsController],
  providers: [
    CreateChemicalReactionUseCase,
    {
      provide: 'IChemicalReactionRepository',
      useClass: PrismaChemicalReactionRepository,
    },
    {
      provide: 'IPureMetalLotRepository',
      useClass: PrismaPureMetalLotRepository, // Reutilizando o repositório do módulo de recovery-orders
    },
  ],
})
export class ChemicalReactionsModule {}
