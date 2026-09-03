import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';
import { MetalCreditsRepository } from '../../metal-credits/repositories/metal-credit.repository';
import { MetalCreditEntity } from '../../metal-credits/entities/metal-credit.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApproveChemicalAnalysisUseCase {
  private readonly logger = new Logger(ApproveChemicalAnalysisUseCase.name);

  constructor(
    private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository,
    private readonly metalCreditsRepository: MetalCreditsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(organizationId: string, id: string): Promise<void> {
    const analysis = await this.chemicalAnalysesRepository.findById(id, organizationId);

    if (!analysis) {
      throw new NotFoundException(`Análise química com ID ${id} não encontrada.`);
    }

    if (!analysis.status.canApprove()) {
      throw new ConflictException(
        `Análise não pode ser aprovada pois seu status é "${analysis.statusValue}".`,
      );
    }

    analysis.approve();

    const creditDate = analysis.dataAnaliseConcluida || analysis.dataEntrada || new Date();
    const grams = analysis.auLiquidoParaClienteGramas || 0;

    await this.chemicalAnalysesRepository.executeInTransaction(async (tx) => {
      if (analysis.clienteId && grams > 0) {
        const metalCredit = MetalCreditEntity.create({
          organizationId,
          clientId: analysis.clienteId,
          chemicalAnalysisId: analysis.id,
          metalType: analysis.metalType,
          grams,
          date: creditDate,
        });

        const createdCredit = await this.metalCreditsRepository.create(metalCredit, tx);

        let metalAccount = await tx.metalAccount.findUnique({
          where: {
            organizationId_personId_type: {
              organizationId,
              personId: analysis.clienteId,
              type: analysis.metalType,
            },
          },
        });

        if (!metalAccount) {
          metalAccount = await tx.metalAccount.create({
            data: {
              organizationId,
              personId: analysis.clienteId,
              type: analysis.metalType,
            },
          });
        }

        await tx.metalAccountEntry.create({
          data: {
            metalAccountId: metalAccount.id,
            date: creditDate,
            description: `Crédito de metal referente à Análise Química ${analysis.numeroAnalise}`,
            grams,
            type: 'CREDIT',
            sourceId: createdCredit.id,
          },
        });
      }

      await this.chemicalAnalysesRepository.save(analysis, tx);
    });
  }
}
