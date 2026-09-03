import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RevertChemicalAnalysisToPendingApprovalUseCase {
  private readonly logger = new Logger(RevertChemicalAnalysisToPendingApprovalUseCase.name);

  constructor(
    private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(organizationId: string, id: string): Promise<void> {
    const analysis = await this.chemicalAnalysesRepository.findById(id, organizationId);

    if (!analysis) {
      throw new NotFoundException(`Análise química com ID ${id} não encontrada.`);
    }

    if (!analysis.status.isApproved) {
      throw new ConflictException(
        `Análise não pode ser revertida pois seu status é "${analysis.statusValue}".`,
      );
    }

    await this.chemicalAnalysesRepository.executeInTransaction(async (tx) => {
      const metalCredit = await tx.metalCredit.findUnique({
        where: {
          chemicalAnalysisId: analysis.id,
          organizationId,
        },
      });

      if (metalCredit) {
        const metalAccountEntry = await tx.metalAccountEntry.findFirst({
          where: {
            sourceId: metalCredit.id,
            type: 'CREDIT',
          },
        });

        if (metalAccountEntry) {
          await tx.metalAccountEntry.delete({
            where: { id: metalAccountEntry.id },
          });
        }

        await tx.metalCredit.delete({
          where: { id: metalCredit.id },
        });
      }

      analysis.revertToPendingApproval();
      await this.chemicalAnalysesRepository.save(analysis, tx);
    });

    this.logger.log(`Análise Química ${id} revertida para ANALISADO_AGUARDANDO_APROVACAO.`);
  }
}
