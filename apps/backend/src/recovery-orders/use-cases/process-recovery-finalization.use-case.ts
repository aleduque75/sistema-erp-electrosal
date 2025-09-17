import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger, // ADDED
} from '@nestjs/common';
import {
  IRecoveryOrderRepository,
  IAnaliseQuimicaRepository,
  RecoveryOrderStatus,
  AnaliseQuimica,
} from '@sistema-erp-electrosal/core';
import {
  IContaMetalRepository,
  TipoMetal,
  ContaMetal,
} from '@sistema-erp-electrosal/core';
import { UpdateContaMetalBalanceUseCase } from '../../contas-metais/use-cases/update-conta-metal-balance.use-case'; // Adicionado
import { FindContaMetalByNameAndMetalTypeUseCase } from '../../contas-metais/use-cases/find-conta-metal-by-name-and-metal-type.use-case'; // Adicionado

export interface FinalizeRecoveryOrderCommand {
  recoveryOrderId: string;
  organizationId: string;
  teorFinal: number;
}

@Injectable()
export class ProcessRecoveryFinalizationUseCase {
  private readonly logger = new Logger(ProcessRecoveryFinalizationUseCase.name); // ADDED
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    @Inject('IContaMetalRepository') // Adicionado
    private readonly contaMetalRepository: IContaMetalRepository, // Adicionado
    private readonly updateContaMetalBalanceUseCase: UpdateContaMetalBalanceUseCase, // Adicionado
    private readonly findContaMetalByNameAndMetalTypeUseCase: FindContaMetalByNameAndMetalTypeUseCase, // Adicionado
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

    // ADDED DEBUG LOGS
    this.logger.debug(`teorFinal: ${teorFinal}`);
    this.logger.debug(`recoveryOrder.resultadoProcessamentoGramas: ${recoveryOrder.resultadoProcessamentoGramas}`);
    this.logger.debug(`auPuroRecuperadoGramas: ${auPuroRecuperadoGramas}`);

    let residueAnalysisId: string | undefined = undefined;

    // --- Create Residue Analysis ---
    if (residuoGramas > 0) {
      const residueAnalysis = AnaliseQuimica.criarResiduo({
        organizationId,
        descricaoMaterial: `Resíduo da Ordem de Recuperação ${recoveryOrder.id.toString()}`,
        volumeOuPesoEntrada: residuoGramas,
        unidadeEntrada: 'g',
        auEstimadoBrutoGramas: residuoGramas, // Corrigido para popular o campo correto
        // Campos não aplicáveis para resíduo são omitidos
        resultadoAnaliseValor: null,
        unidadeResultado: null,
        percentualQuebra: null,
        taxaServicoPercentual: null,
        teorRecuperavel: null,
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

    // --- Credit auPuroRecuperadoGramas to Metal Account ---
    if (auPuroRecuperadoGramas > 0) {
      let estoqueMetalAccount = await this.findContaMetalByNameAndMetalTypeUseCase.execute({
        name: 'Estoque de Metal para Reação', // Nome da conta de estoque
        metalType: TipoMetal.AU, // Tipo de metal
        organizationId,
      }).catch(() => null); // Captura NotFoundException se a conta não existir

      if (!estoqueMetalAccount) {
        // Se a conta não existe, cria uma
        estoqueMetalAccount = await this.contaMetalRepository.create(
          ContaMetal.create({
            organizationId,
            name: 'Estoque de Metal para Reação',
            metalType: TipoMetal.AU,
          }),
        );
      }

      await this.updateContaMetalBalanceUseCase.execute({
        id: estoqueMetalAccount.id.toString(),
        organizationId,
        amount: auPuroRecuperadoGramas,
        type: 'credit',
      });
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
