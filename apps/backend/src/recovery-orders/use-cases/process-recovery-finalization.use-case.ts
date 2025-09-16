import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  IRecoveryOrderRepository,
  IAnaliseQuimicaRepository,
  RecoveryOrderStatus,
  AnaliseQuimica,
} from '@sistema-erp-electrosal/core';

export interface FinalizeRecoveryOrderCommand {
  recoveryOrderId: string;
  organizationId: string;
  teorFinal: number;
}

@Injectable()
export class ProcessRecoveryFinalizationUseCase { // Filename is kept, but logic is for finalization
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
  ) {}

  async execute(command: FinalizeRecoveryOrderCommand): Promise<void> {
    const { recoveryOrderId, organizationId, teorFinal } = command;

    if (teorFinal <= 0 || teorFinal > 1) {
        throw new BadRequestException('O teor final deve ser um valor entre 0 e 1.');
    }

    const recoveryOrder = await this.recoveryOrderRepository.findById(
      recoveryOrderId,
      organizationId,
    );

    if (!recoveryOrder) {
      throw new NotFoundException(
        `Ordem de recuperação com ID ${recoveryOrderId} não encontrada.`,
      );
    }

    if (recoveryOrder.status !== RecoveryOrderStatus.AGUARDANDO_TEOR) {
      throw new ConflictException(
        `A ordem de recuperação não pode ser finalizada, pois não está com o status AGUARDANDO_TEOR.`,
      );
    }

    if (!recoveryOrder.resultadoProcessamentoGramas) {
        throw new ConflictException(
            'Não é possível finalizar a ordem de recuperação sem o resultado do processamento.',
        );
    }

    // --- Calculations ---
    const auPuroRecuperadoGramas = recoveryOrder.resultadoProcessamentoGramas * teorFinal;
    const residuoGramas = recoveryOrder.totalBrutoEstimadoGramas - auPuroRecuperadoGramas;

    let residueAnalysisId: string | undefined = undefined;

    // --- Create Residue Analysis ---
    if (residuoGramas > 0) {
      const residueAnalysis = AnaliseQuimica.criarResiduo({
        organizationId,
        descricaoMaterial: `Resíduo da Ordem de Recuperação ${recoveryOrder.id.toString()}`,
        volumeOuPesoEntrada: residuoGramas,
        unidadeEntrada: 'g',
        // Campos não aplicáveis para resíduo são omitidos
        resultadoAnaliseValor: null,
        unidadeResultado: null,
        percentualQuebra: null,
        taxaServicoPercentual: null,
        teorRecuperavel: null,
        auEstimadoBrutoGramas: null,
        auEstimadoRecuperavelGramas: null,
        taxaServicoEmGramas: null,
        auLiquidoParaClienteGramas: null,
        dataAnaliseConcluida: null,
        dataAprovacaoCliente: null,
        dataFinalizacaoRecuperacao: null,
        observacoes: 'Análise de resíduo gerada automaticamente.',
        ordemDeRecuperacaoId: null,
      });
      
      const createdResidue = await this.analiseRepository.create(residueAnalysis, organizationId);
      residueAnalysisId = createdResidue.id.toString();
    }

    // --- Update Recovery Order ---
    recoveryOrder.update({
      status: RecoveryOrderStatus.FINALIZADA,
      teorFinal,
      auPuroRecuperadoGramas,
      residuoGramas,
      residueAnalysisId,
      dataFim: new Date(),
    });

    await this.recoveryOrderRepository.save(recoveryOrder);
  }
}
