import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  IAnaliseQuimicaRepository,
  IMetalCreditRepository,
  AnaliseQuimica,
} from '@sistema-erp-electrosal/core';
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core/domain/enums/status-analise-quimica';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path as needed

export interface RevertAnaliseQuimicaToPendingApprovalCommand {
  analiseId: string;
  organizationId: string;
}

@Injectable()
export class RevertAnaliseQuimicaToPendingApprovalUseCase {
  private readonly logger = new Logger(RevertAnaliseQuimicaToPendingApprovalUseCase.name);

  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    @Inject('IMetalCreditRepository')
    private readonly metalCreditRepository: IMetalCreditRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: RevertAnaliseQuimicaToPendingApprovalCommand): Promise<void> {
    const { analiseId, organizationId } = command;

    const analise = await this.analiseRepository.findById(
      analiseId,
      organizationId,
    );

    if (!analise) {
      throw new NotFoundException(
        `Análise química com ID ${analiseId} não encontrada.`,
      );
    }

    if (analise.status !== StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO) {
      throw new ConflictException(
        `Análise não pode ser revertida pois não está no status APROVADO_PARA_RECUPERACAO.`,
      );
    }

    // Find and delete associated MetalCredit
    const metalCredit = await this.prisma.metalCredit.findUnique({
      where: {
        chemicalAnalysisId: analise.id.toString(),
        organizationId: organizationId,
      },
    });

    if (metalCredit) {
      // Find and delete associated MetalAccountEntry (CREDIT type)
      const metalAccountEntry = await this.prisma.metalAccountEntry.findFirst({
        where: {
          sourceId: metalCredit.id,
          type: 'CREDIT',
        },
      });

      if (metalAccountEntry) {
        this.logger.debug(`[REVERT_ANALISE] Deletando MetalAccountEntry ${metalAccountEntry.id}`);
        await this.prisma.metalAccountEntry.delete({
          where: { id: metalAccountEntry.id },
        });
      }

      this.logger.debug(`[REVERT_ANALISE] Deletando MetalCredit ${metalCredit.id}`);
      await this.prisma.metalCredit.delete({
        where: { id: metalCredit.id },
      });
    }

    analise.revertToPendingApproval(); // Assuming this method exists on AnaliseQuimica entity

    await this.analiseRepository.save(analise);
    this.logger.log(
      `Análise Química ${analiseId} revertida para ${StatusAnaliseQuimica.ANALISADO_AGUARDANDO_APROVACAO}.`,
    );
  }
}
