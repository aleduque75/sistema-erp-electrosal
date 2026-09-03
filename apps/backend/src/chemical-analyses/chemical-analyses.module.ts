import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaModule } from '../pessoa/pessoa.module';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';
import { MetalCreditsModule } from '../metal-credits/metal-credits.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SettingsModule } from '../settings/settings.module';

import { ChemicalAnalysesController } from './chemical-analyses.controller';
import { ChemicalAnalysesRepository } from './repositories/chemical-analyses.repository';
import { PrismaChemicalAnalysesRepository } from './repositories/prisma-chemical-analyses.repository';

// Use Cases
import { CreateChemicalAnalysisUseCase } from './use-cases/create-chemical-analysis.use-case';
import { ListChemicalAnalysesUseCase } from './use-cases/list-chemical-analyses.use-case';
import { GetChemicalAnalysisByIdUseCase } from './use-cases/get-chemical-analysis-by-id.use-case';
import { PostChemicalAnalysisResultUseCase } from './use-cases/post-chemical-analysis-result.use-case';
import { ApproveChemicalAnalysisUseCase } from './use-cases/approve-chemical-analysis.use-case';
import { RejectChemicalAnalysisUseCase } from './use-cases/reject-chemical-analysis.use-case';
import { RedoChemicalAnalysisUseCase } from './use-cases/redo-chemical-analysis.use-case';
import { RevertChemicalAnalysisToPendingApprovalUseCase } from './use-cases/revert-chemical-analysis-to-pending-approval.use-case';
import { WriteOffResidueUseCase } from './use-cases/write-off-residue.use-case';
import { UpdateChemicalAnalysisUseCase } from './use-cases/update-chemical-analysis.use-case';
import { GenerateChemicalAnalysisPdfUseCase } from './use-cases/generate-chemical-analysis-pdf.use-case';

@Module({
  imports: [
    PrismaModule,
    PessoaModule,
    MetalCreditsModule,
    MetalAccountsModule,
    QuotationsModule,
    SettingsModule,
  ],
  controllers: [ChemicalAnalysesController],
  providers: [
    // Repository binding with DIP
    {
      provide: ChemicalAnalysesRepository,
      useClass: PrismaChemicalAnalysesRepository,
    },
    {
      provide: 'IAnaliseQuimicaRepository',
      useClass: PrismaChemicalAnalysesRepository,
    },

    // Use Cases
    CreateChemicalAnalysisUseCase,
    ListChemicalAnalysesUseCase,
    GetChemicalAnalysisByIdUseCase,
    PostChemicalAnalysisResultUseCase,
    ApproveChemicalAnalysisUseCase,
    RejectChemicalAnalysisUseCase,
    RedoChemicalAnalysisUseCase,
    RevertChemicalAnalysisToPendingApprovalUseCase,
    WriteOffResidueUseCase,
    UpdateChemicalAnalysisUseCase,
    GenerateChemicalAnalysisPdfUseCase,
  ],
  exports: [
    ChemicalAnalysesRepository,
    'IAnaliseQuimicaRepository',
    CreateChemicalAnalysisUseCase,
    ListChemicalAnalysesUseCase,
    GetChemicalAnalysisByIdUseCase,
    PostChemicalAnalysisResultUseCase,
    ApproveChemicalAnalysisUseCase,
    RejectChemicalAnalysisUseCase,
    RedoChemicalAnalysisUseCase,
    RevertChemicalAnalysisToPendingApprovalUseCase,
    WriteOffResidueUseCase,
    UpdateChemicalAnalysisUseCase,
    GenerateChemicalAnalysisPdfUseCase,
  ],
})
export class ChemicalAnalysesModule {}
