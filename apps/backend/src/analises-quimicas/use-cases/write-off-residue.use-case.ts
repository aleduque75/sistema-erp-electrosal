import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusAnaliseQuimicaPrisma, TipoContaContabilPrisma, TipoTransacaoPrisma } from '@prisma/client';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import Decimal from 'decimal.js';

@Injectable()
export class WriteOffResidueUseCase {
  private readonly logger = new Logger(WriteOffResidueUseCase.name);
  private LOSS_ACCOUNT_CODE = '5.2.1.4';
  private LOSS_ACCOUNT_NAME = 'Perdas em Recuperação';

  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationsService: QuotationsService,
    private readonly settingsService: SettingsService,
  ) {}

  async execute(analiseId: string, organizationId: string, userId: string): Promise<void> {
    this.logger.log(`Iniciando baixa de resíduo para a análise ID: ${analiseId}`);

    const analise = await this.prisma.analiseQuimica.findFirst({
      where: { id: analiseId, organizationId },
      include: { recoveryOrderAsResidue: true }, // Include the relation
    });

    if (!analise) {
      throw new NotFoundException(`Análise Química com ID ${analiseId} não encontrada.`);
    }
    
    // A análise deve ser um resíduo para ser baixada.
    if (!analise.recoveryOrderAsResidue) {
      throw new ConflictException('Apenas análises que são resíduos de uma Ordem de Recuperação podem ser baixadas como perda.');
    }

    if (analise.isWriteOff) {
      throw new ConflictException('Esta análise de resíduo já foi baixada.');
    }

    const lossAmountGrams = new Decimal(analise.auEstimadoBrutoGramas || 0);
    if (lossAmountGrams.isZero()) {
      throw new ConflictException('A análise não possui valor de metal estimado para baixar.');
    }

    const quotation = await this.quotationsService.findLatest(analise.metalType, organizationId, new Date());
    if (!quotation) {
      throw new NotFoundException('Nenhuma cotação encontrada para o tipo de metal da análise.');
    }

    const lossAmountBRL = lossAmountGrams.times(quotation.sellPrice);
    this.logger.log(`Valor da perda calculado: ${lossAmountGrams.toFixed(4)}g = R$ ${lossAmountBRL.toFixed(2)} @ R$ ${quotation.sellPrice.toFixed(2)}/g`);

    const lossAccount = await this.findOrCreateLossAccount(organizationId);
    const productionCostAccount = await this.getProductionCostAccount(organizationId, userId);

    await this.prisma.$transaction(async (tx) => {
      // Create the DEBIT transaction (the expense)
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: lossAmountBRL,
          moeda: 'BRL',
          descricao: `Perda em recuperação referente à Análise de Resíduo Nº ${analise.numeroAnalise}`,
          dataHora: new Date(),
          contaContabilId: lossAccount.id,
          goldAmount: lossAmountGrams,
          goldPrice: quotation.sellPrice,
        },
      });

      // Create the balancing CREDIT transaction
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: lossAmountBRL,
          moeda: 'BRL',
          descricao: `Crédito de ajuste para perda em recuperação da Análise Nº ${analise.numeroAnalise}`,
          dataHora: new Date(),
          contaContabilId: productionCostAccount.id,
          goldAmount: lossAmountGrams,
          goldPrice: quotation.sellPrice,
        },
      });
      
      // Update the analysis to mark it as written off and cancel it
      await tx.analiseQuimica.update({
        where: { id: analiseId },
        data: { 
          isWriteOff: true,
          status: StatusAnaliseQuimicaPrisma.CANCELADO,
        },
      });
    });

    this.logger.log(`Baixa do resíduo da análise ID: ${analiseId} concluída com sucesso.`);
  }

  private async findOrCreateLossAccount(organizationId: string) {
    const existingAccount = await this.prisma.contaContabil.findFirst({
      where: { codigo: this.LOSS_ACCOUNT_CODE, organizationId },
    });

    if (existingAccount) {
      return existingAccount;
    }

    this.logger.log(`Conta de perda não encontrada. Criando nova conta: "${this.LOSS_ACCOUNT_NAME}"`);

    const parentAccount = await this.prisma.contaContabil.findFirst({
        where: { codigo: '5.2.1', organizationId },
    });

    if(!parentAccount) {
        throw new InternalServerErrorException('Conta pai "Custos de Recuperação de Metais" (5.2.1) não encontrada.');
    }

    return this.prisma.contaContabil.create({
      data: {
        organizationId,
        codigo: this.LOSS_ACCOUNT_CODE,
        nome: this.LOSS_ACCOUNT_NAME,
        tipo: TipoContaContabilPrisma.DESPESA,
        aceitaLancamento: true,
        contaPaiId: parentAccount.id,
      },
    });
  }

  private async getProductionCostAccount(organizationId: string, userId: string) {
    const userSettings = await this.settingsService.findOne(userId);
    const productionCostAccountId = userSettings?.productionCostAccountId;

    if (!productionCostAccountId) {
      throw new InternalServerErrorException('A conta contábil para "Custo de Produção" não está configurada nas definições do usuário.');
    }

    const account = await this.prisma.contaContabil.findFirst({
        where: { id: productionCostAccountId, organizationId }
    });

    if (!account) {
        throw new InternalServerErrorException(`A conta de Custo de Produção com ID ${productionCostAccountId} não foi encontrada.`);
    }
    return account;
  }
}
