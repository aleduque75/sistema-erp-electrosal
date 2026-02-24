import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { ChemicalReactionsController } from './chemical-reactions.controller';
import { CreateChemicalReactionUseCase } from './use-cases/create-chemical-reaction.use-case';
import { CompleteProductionStepUseCase } from './use-cases/complete-production-step.use-case';
import { AdjustPurityUseCase } from './use-cases/adjust-purity.use-case';
import { AddRawMaterialToChemicalReactionUseCase } from './use-cases/add-raw-material.use-case';
import { AssociateImageToChemicalReactionUseCase } from './use-cases/associate-image-to-chemical-reaction.use-case';
import { AddPureMetalLotToChemicalReactionUseCase } from './use-cases/add-pure-metal-lot-to-chemical-reaction.use-case';
import { RemovePureMetalLotFromChemicalReactionUseCase } from './use-cases/remove-pure-metal-lot-from-chemical-reaction.use-case';
import { UpdateChemicalReactionUseCase } from './use-cases/update-chemical-reaction.use-case';
import { UpdateChemicalReactionLotsUseCase } from './use-cases/update-chemical-reaction-lots.use-case';
import { GenerateChemicalReactionPdfUseCase } from './use-cases/generate-chemical-reaction-pdf.use-case';
import { PrismaChemicalReactionRepository } from './repositories/prisma-chemical-reaction.repository';
import { PrismaMediaRepository } from '../media/repositories/prisma-media.repository';
import { PrismaPureMetalLotRepository } from '../recovery-orders/repositories/prisma-pure-metal-lot.repository';

import { MediaModule } from '../media/media.module';

@Module({
  imports: [PrismaModule, QuotationsModule, PureMetalLotsModule, MediaModule],
  controllers: [ChemicalReactionsController],
  providers: [
    CreateChemicalReactionUseCase,
    CompleteProductionStepUseCase,
    AdjustPurityUseCase,
    AddRawMaterialToChemicalReactionUseCase,
    AssociateImageToChemicalReactionUseCase,
    AddPureMetalLotToChemicalReactionUseCase,
    RemovePureMetalLotFromChemicalReactionUseCase,
    UpdateChemicalReactionUseCase,
    UpdateChemicalReactionLotsUseCase,
    GenerateChemicalReactionPdfUseCase,
    {
      provide: 'IChemicalReactionRepository',
      useClass: PrismaChemicalReactionRepository,
    },
    {
      provide: 'IMediaRepository',
      useClass: PrismaMediaRepository,
    },
    {
      provide: 'IPureMetalLotRepository',
      useClass: PrismaPureMetalLotRepository,
    },
  ],
})
export class ChemicalReactionsModule { }