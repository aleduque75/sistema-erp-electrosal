import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RecoveryOrderStatus } from '@sistema-erp-electrosal/core/domain/enums/recovery-order-status.enum';
import {
  IRecoveryOrderRepository,
  IAnaliseQuimicaRepository,
  AnaliseQuimica,
  PureMetalLot,
  IPureMetalLotRepository,
  TipoMetal,
  IMetalAccountRepository,
  IMetalAccountEntryRepository,
  MetalAccountEntry,
  IPessoaRepository,
  EmailVO,
} from '@sistema-erp-electrosal/core';
import { QuotationsService } from '../../quotations/quotations.service';
import { ContasContabeisService } from '../../contas-contabeis/contas-contabeis.service';
import { TransacoesService } from '../../transacoes/transacoes.service';
import { UsersService } from '../../users/users.service';
import { TipoTransacaoPrisma } from '@prisma/client';

export interface FinalizeRecoveryOrderCommand {
  recoveryOrderId: string;
  organizationId: string;
  teorFinal: number;
}

@Injectable()
export class ProcessRecoveryFinalizationUseCase {
  private readonly logger = new Logger(ProcessRecoveryFinalizationUseCase.name);

  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    @Inject('IPureMetalLotRepository')
    private readonly pureMetalLotRepository: IPureMetalLotRepository,
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
    @Inject('IMetalAccountEntryRepository')
    private readonly metalAccountEntryRepository: IMetalAccountEntryRepository,
    @Inject('IPessoaRepository')
    private readonly pessoaRepository: IPessoaRepository,
    private readonly cotacoesService: QuotationsService,
    private readonly contasContabeisService: ContasContabeisService,
    private readonly transacoesService: TransacoesService,
    private readonly usersService: UsersService,
  ) {}

  async execute(command: FinalizeRecoveryOrderCommand): Promise<void> {
    const { recoveryOrderId, organizationId, teorFinal } = command;

    // Criar EmailVO para o cliente interno
    const internalClientEmail = new EmailVO('interno@electrosal.com');

    // Buscar o cliente interno
    const internalClient = await this.pessoaRepository.findByEmail(
      internalClientEmail,
      organizationId,
    );

    if (!internalClient) {
      throw new NotFoundException(
        `Cliente interno (interno@electrosal.com) não encontrado. Certifique-se de que o seed foi executado corretamente.`,
      );
    }

    this.logger.log(`ID do cliente interno encontrado: ${internalClient.id.toString()}`);

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

    this.logger.log(`Teor Final: ${teorFinal}`);
    this.logger.log(`Resultado Processamento Gramas: ${recoveryOrder.resultadoProcessamentoGramas}`);
    this.logger.log(`Au Puro Recuperado: ${auPuroRecuperadoGramas}`);

    // --- Create Pure Metal Lot ---
    if (auPuroRecuperadoGramas > 0) {
      const pureMetalLot = PureMetalLot.create({
        organizationId,
        sourceType: 'RECOVERY_ORDER',
        sourceId: recoveryOrder.id.toString(),
        metalType: TipoMetal.AU,
        initialGrams: auPuroRecuperadoGramas,
        remainingGrams: auPuroRecuperadoGramas,
        purity: teorFinal,
        notes: `Lote gerado a partir da Ordem de Recuperação #${recoveryOrder.id.toString()}`,
      });
      await this.pureMetalLotRepository.create(pureMetalLot);
      this.logger.log(`Lote de metal puro criado: ${pureMetalLot.id.toString()}`);


    }

    let residueAnalysisId: string | undefined = undefined;

    // --- Create Residue Analysis ---
    if (residuoGramas > 0) {
      const residueAnalysis = AnaliseQuimica.criarResiduo({
        organizationId,
        clienteId: internalClient.id.toString(), // Passar o clienteId do cliente interno
        descricaoMaterial: `Resíduo da Ordem de Recuperação ${recoveryOrder.id.toString()}`,
        volumeOuPesoEntrada: residuoGramas,
        unidadeEntrada: 'g',
        auEstimadoBrutoGramas: residuoGramas,
      });

      const createdResidue = await this.analiseRepository.create(residueAnalysis, organizationId);
      residueAnalysisId = createdResidue.id.toString();
      this.logger.log(`Payload da AnaliseQuimica de resíduo para o repositório: ${JSON.stringify(residueAnalysis)}`);
      this.logger.log(`Análise de resíduo criada: ${residueAnalysisId}`);
    }

    // --- Create Financial Transaction ---
    if (auPuroRecuperadoGramas > 0) {
      const cotacao = await this.cotacoesService.findLatest(TipoMetal.AU, organizationId);
      if (cotacao && parseFloat(cotacao.buyPrice.toString()) > 0) {
        const valorBRL = auPuroRecuperadoGramas * parseFloat(cotacao.buyPrice.toString());
        this.logger.log(`Valor BRL do metal recuperado: ${valorBRL}`);

        const userSettings = await this.usersService.getUserSettingsByOrganizationId(organizationId);
        if (!userSettings || !userSettings.metalStockAccountId || !userSettings.productionCostAccountId) {
          this.logger.warn(`Contas contábeis para estoque ou custo não configuradas para a organização ${organizationId}.`);
        } else {
          const contaDebito = await this.contasContabeisService.findOne(organizationId, userSettings.metalStockAccountId);
          const contaCredito = await this.contasContabeisService.findOne(organizationId, userSettings.productionCostAccountId);

          if (contaDebito && contaCredito) {
            const dataTransacao = new Date();
            // Débito (Aumenta o valor do estoque de metal)
            await this.transacoesService.create({
              descricao: `Valorização de estoque por recuperação de metal da Ordem #${recoveryOrder.id.toString()}`,
              valor: valorBRL,
              tipo: TipoTransacaoPrisma.DEBITO,
              dataHora: dataTransacao,
              contaContabilId: contaDebito.id,
            }, organizationId);

            // Crédito (Registra o custo da produção/recuperação)
            await this.transacoesService.create({
              descricao: `Contrapartida da valorização de estoque da Ordem #${recoveryOrder.id.toString()}`,
              valor: valorBRL,
              tipo: TipoTransacaoPrisma.CREDITO,
              dataHora: dataTransacao,
              contaContabilId: contaCredito.id,
            }, organizationId);
            this.logger.log(`Lançamento contábil de valorização de estoque gerado.`);
          }
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
    this.logger.log(`Ordem de recuperação ${recoveryOrderId} finalizada com sucesso.`);
  }
}