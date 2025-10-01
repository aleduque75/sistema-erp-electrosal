import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { ChemicalReactionsController } from './chemical-reactions.controller';
import { CreateChemicalReactionUseCase } from './use-cases/create-chemical-reaction.use-case';
import { CompleteProductionStepUseCase } from './use-cases/complete-production-step.use-case';
import { AdjustPurityUseCase } from './use-cases/adjust-purity.use-case';

@Module({
  imports: [PrismaModule, QuotationsModule],
  controllers: [ChemicalReactionsController],
  providers: [
    CreateChemicalReactionUseCase,
    CompleteProductionStepUseCase,
    AdjustPurityUseCase,
  ],
})
export class ChemicalReactionsModule {}