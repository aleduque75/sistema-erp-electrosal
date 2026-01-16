import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core/domain/enums/status-analise-quimica';
import {
  IAnaliseQuimicaRepository,
  IRecoveryOrderRepository,
  RecoveryOrder,
  RecoveryOrderStatus,
  TipoMetal,
} from '@sistema-erp-electrosal/core';
import { GenerateNextNumberUseCase } from '../../common/use-cases/generate-next-number.use-case';
import { EntityType } from '@prisma/client';
import { AddRawMaterialToRecoveryOrderUseCase } from './add-raw-material.use-case';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateRecoveryOrderCommand {
  organizationId: string;
  chemicalAnalysisIds: string[];
  metalType: TipoMetal;
  dataInicio?: string;
  dataFim?: string;
  descricaoProcesso?: string;
  salespersonId?: string;
  commissionPercentage?: number;
  commissionAmount?: number;
  rawMaterials?: { rawMaterialId: string; quantity: number }[];
}

@Injectable()
export class CreateRecoveryOrderUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    private readonly generateNextNumberUseCase: GenerateNextNumberUseCase,
    private readonly addRawMaterialUseCase: AddRawMaterialToRecoveryOrderUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: CreateRecoveryOrderCommand): Promise<RecoveryOrder> {
    const {
      organizationId,
      chemicalAnalysisIds,
      metalType,
      dataInicio,
      dataFim,
      descricaoProcesso,
      salespersonId,
      commissionPercentage,
      commissionAmount,
      rawMaterials,
    } = command;

    const orderNumber = await this.generateNextNumberUseCase.execute(
      organizationId,
      EntityType.RECOVERY_ORDER,
      'REC-',
      1,
    );

    if (!chemicalAnalysisIds || chemicalAnalysisIds.length === 0) {
      throw new BadRequestException(
        'É necessário informar ao menos uma análise química para criar uma ordem de recuperação.',
      );
    }

    const analyses = await Promise.all(
      chemicalAnalysisIds.map((id) =>
        this.analiseRepository.findById(id, organizationId),
      ),
    );

    const missingAnalyses = analyses.filter((analise) => !analise);
    if (missingAnalyses.length > 0) {
      throw new NotFoundException(
        'Algumas análises químicas informadas não foram encontradas.',
      );
    }

    const invalidStatusAnalyses = analyses.filter(
      (analise) =>
        analise.status !== StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO,
    );
    if (invalidStatusAnalyses.length > 0) {
      throw new ConflictException(
        'Algumas análises químicas não estão com o status APROVADO_PARA_RECUPERACAO.',
      );
    }

    // Validate that all analyses have the same metalType as the one provided
    const mismatchedMetalTypeAnalyses = analyses.filter(
      (analise) => analise.metalType !== metalType,
    );
    if (mismatchedMetalTypeAnalyses.length > 0) {
      throw new BadRequestException(
        `Todas as análises devem ser do mesmo tipo de metal (${metalType}). Análises com IDs [${mismatchedMetalTypeAnalyses.map(a => a.id).join(', ')}] são de um tipo diferente.`,
      );
    }

    const totalBrutoEstimadoGramas = analyses.reduce((sum, analise) => {
      let gramsToAdd = 0;
      if (analise.auEstimadoBrutoGramas && analise.auEstimadoBrutoGramas > 0) {
        gramsToAdd = analise.auEstimadoBrutoGramas;
      } else if (analise.volumeOuPesoEntrada && analise.volumeOuPesoEntrada > 0) {
        // If it's a RESIDUO analysis, use volumeOuPesoEntrada if auEstimadoBrutoGramas is not available
        gramsToAdd = analise.volumeOuPesoEntrada;
      }
      return sum + gramsToAdd;
    }, 0);

    if (totalBrutoEstimadoGramas <= 0) {
      throw new BadRequestException(
        'O somatório dos pesos das análises não pode ser zero ou negativo.',
      );
    }

    const recoveryOrder = RecoveryOrder.create({
      organizationId,
      orderNumber,
      metalType,
      chemicalAnalysisIds,
      dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
      dataFim: dataFim ? new Date(dataFim) : undefined,
      descricaoProcesso,
      totalBrutoEstimadoGramas,
      salespersonId,
      commissionPercentage,
      commissionAmount,
    });

    return await this.prisma.$transaction(async (tx) => {
      const createdRecoveryOrder = await this.recoveryOrderRepository.create(
        recoveryOrder,
        tx as any, // Repository might need adjustment to accept tx
      );

      // Update status of chemical analyses
      for (const analise of analyses) {
        analise.update({ status: StatusAnaliseQuimica.EM_RECUPERACAO });
        await this.analiseRepository.save(analise, organizationId, tx as any);
      }

      // Add raw materials if provided
      if (rawMaterials && rawMaterials.length > 0) {
        for (const rm of rawMaterials) {
          await this.addRawMaterialUseCase.execute(
            organizationId,
            createdRecoveryOrder.id.toString(),
            rm,
            tx,
          );
        }
      }

      return createdRecoveryOrder;
    });
  }
}

