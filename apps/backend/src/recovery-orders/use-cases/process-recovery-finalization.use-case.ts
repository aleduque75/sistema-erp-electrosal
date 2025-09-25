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
import { QuotationsService } from '../../quotations/quotations.service';
import { ContasContabeisService } from '../../contas-contabeis/contas-contabeis.service';
import { TransacoesService } from '../../transacoes/transacoes.service';
import { CreateTransacaoDto } from '../../transacoes/dtos/create-transacao.dto';

import { UsersService } from '../../users/users.service';
import { TipoTransacaoPrisma } from '@prisma/client';

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
    private readonly cotacoesService: QuotationsService,
    private readonly contasContabeisService: ContasContabeisService,
    private readonly transacoesService: TransacoesService,
    private readonly usersService: UsersService,
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
    console.log(`teorFinal: ${teorFinal}`);
    console.log(`recoveryOrder.resultadoProcessamentoGramas: ${recoveryOrder.resultadoProcessamentoGramas}`);
    console.log(`auPuroRecuperadoGramas: ${auPuroRecuperadoGramas}`);

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

      // --- Create Financial Transaction ---
      const cotacao = await this.cotacoesService.findLatest(TipoMetal.AU, organizationId);
      console.log(`Cotação encontrada: ${JSON.stringify(cotacao)}`); // ADDED

      if (cotacao && parseFloat(cotacao.buyPrice.toString()) > 0) {
        const valorBRL = auPuroRecuperadoGramas * parseFloat(cotacao.buyPrice.toString());
        console.log(`Valor BRL calculado: ${valorBRL}`); // ADDED

        const userSettings = await this.usersService.getUserSettingsByOrganizationId(organizationId);
        console.log(`User Settings: ${JSON.stringify(userSettings)}`); // ADDED

        if (!userSettings || !userSettings.metalStockAccountId || !userSettings.productionCostAccountId) {
          console.warn(`Configurações de contas contábeis para estoque de metal ou custo de produção não encontradas para a organização ${organizationId}. Lançamento contábil não será gerado.`);
          // Optionally throw an error or return early if this is a critical requirement
        } else {
          const contaDebito = await this.contasContabeisService.findOne(organizationId, userSettings.metalStockAccountId);
          const contaCredito = await this.contasContabeisService.findOne(organizationId, userSettings.productionCostAccountId);
          console.log(`Conta Débito: ${JSON.stringify(contaDebito)}`); // ADDED
          console.log(`Conta Crédito: ${JSON.stringify(contaCredito)}`); // ADDED

          const dataTransacao = new Date();

          // Débito
          await this.transacoesService.create({
            descricao: `Valorização de estoque por recuperação de metal da Ordem #${recoveryOrder.id.toString()}`,
            valor: valorBRL,
            tipo: TipoTransacaoPrisma.DEBITO,
            dataHora: dataTransacao,
            contaContabilId: contaDebito.id,
          }, organizationId);
          console.log(`Transação de débito criada.`); // ADDED

          // Crédito
          await this.transacoesService.create({
            descricao: `Contrapartida da valorização de estoque da Ordem #${recoveryOrder.id.toString()}`,
            valor: valorBRL,
            tipo: TipoTransacaoPrisma.CREDITO,
            dataHora: dataTransacao,
            contaContabilId: contaCredito.id,
          }, organizationId);
          console.log(`Transação de crédito criada.`); // ADDED
        }
      }
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
