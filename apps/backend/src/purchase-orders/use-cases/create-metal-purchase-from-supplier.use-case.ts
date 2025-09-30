import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoMetal, TipoTransacaoPrisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { IPureMetalLotRepository, IMetalAccountRepository, IMetalAccountEntryRepository, PureMetalLot, MetalAccountEntry } from '@sistema-erp-electrosal/core';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';

export interface CreateMetalPurchaseFromSupplierCommand {
  organizationId: string;
  supplierPessoaId: string;
  grams: number;
  notes?: string;
  paymentMethod: 'A_VISTA' | 'A_PRAZO'; // Simplificado por enquanto
  contaCorrenteId?: string; // Para pagamento à vista em BRL
  paymentTermId?: string; // Para pagamento a prazo
}

@Injectable()
export class CreateMetalPurchaseFromSupplierUseCase {
  constructor(
    private prisma: PrismaService,
    @Inject('IPureMetalLotRepository')
    private readonly pureMetalLotRepository: IPureMetalLotRepository,
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
    @Inject('IMetalAccountEntryRepository')
    private readonly metalAccountEntryRepository: IMetalAccountEntryRepository,
    private readonly quotationsService: QuotationsService,
    private readonly settingsService: SettingsService,
  ) {}

  async execute(command: CreateMetalPurchaseFromSupplierCommand): Promise<void> {
    const { organizationId, supplierPessoaId, grams, notes, paymentMethod, contaCorrenteId, paymentTermId } = command;

    if (grams <= 0) {
      throw new BadRequestException('A quantidade de metal deve ser maior que zero.');
    }

    // 1. Encontrar a MetalAccount do fornecedor
    const supplierMetalAccount = await this.metalAccountRepository.findByPersonId(
      supplierPessoaId,
      TipoMetal.AU, // Assumindo compra de ouro
      organizationId,
    );

    if (!supplierMetalAccount) {
      throw new NotFoundException(`Conta de metal do fornecedor ${supplierPessoaId} não encontrada.`);
    }

    // 2. Verificar saldo do fornecedor (simplificado, idealmente buscar saldo agregado)
    // Por enquanto, vamos assumir que o saldo é suficiente e o repositório fará a validação

    // 3. Deduzir do saldo do fornecedor (criar MetalAccountEntry negativo)
    const metalAccountEntry = MetalAccountEntry.create({
      metalAccountId: supplierMetalAccount.id.toString(),
      date: new Date(),
      description: `Retirada de metal pelo fornecedor ${supplierPessoaId}`,
      grams: new Decimal(grams).negated(), // Valor negativo para deduzir
      type: 'PURCHASE_WITHDRAWAL',
      sourceId: 'N/A', // Será atualizado com o ID da transação/AP
      organizationId,
    });
    await this.metalAccountEntryRepository.create(metalAccountEntry);

    // 4. Adicionar ao pure_metal_lots da empresa
    const pureMetalLot = PureMetalLot.create({
      organizationId,
      sourceType: 'SUPPLIER_PURCHASE',
      sourceId: 'N/A', // Será atualizado com o ID da transação/AP
      metalType: TipoMetal.AU,
      initialGrams: new Decimal(grams),
      remainingGrams: new Decimal(grams),
      purity: new Decimal(1), // Assumimos pureza 100%
      notes: notes || `Compra de metal do fornecedor ${supplierPessoaId}`,
    });
    await this.pureMetalLotRepository.create(pureMetalLot);

    // 5. Criar AccountsPayable e Transação Financeira (em BRL)
    const latestGoldQuote = await this.quotationsService.findLatest(TipoMetal.AU, organizationId);
    if (!latestGoldQuote || latestGoldQuote.buyPrice.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Nenhuma cotação de ouro de compra encontrada para hoje.');
    }

    const valorBRL = new Decimal(grams).times(latestGoldQuote.buyPrice);

    const settings = await this.settingsService.findOne(organizationId); // Assumindo que findOne pode buscar por organizationId
    if (!settings?.defaultContasAPagarContaId || !settings?.defaultMetalStockAccountId) {
      throw new BadRequestException('Contas contábeis padrão para Contas a Pagar ou Estoque de Metal não configuradas.');
    }

    await this.prisma.$transaction(async (tx) => {
      let accountsPayableId: string | undefined;
      // Criar AccountsPayable
      if (paymentMethod === 'A_PRAZO') {
        if (!paymentTermId) {
          throw new BadRequestException('Termo de pagamento é obrigatório para compras a prazo.');
        }
        const accountsPayable = await tx.accountPay.create({
          data: {
            organizationId,
            amount: valorBRL,
            dueDate: new Date(), // TODO: Calcular data de vencimento com base no paymentTermId
            description: notes || `Compra a prazo de metal do fornecedor ${supplierPessoaId}`,
          },
        });
        accountsPayableId = accountsPayable.id;
      }

      // Atualizar sourceId para MetalAccountEntry e PureMetalLot
      if (accountsPayableId) {
        await tx.metalAccountEntry.update({
          where: { id: metalAccountEntry.id.toString() }, // Assuming metalAccountEntry has an id
          data: { sourceId: accountsPayableId },
        });
        await tx.pure_metal_lots.update({
          where: { id: pureMetalLot.id.toString() }, // Assuming pureMetalLot has an id
          data: { sourceId: accountsPayableId },
        });
      }

      // Criar Transação Financeira (Débito no Estoque de Metal, Crédito em Contas a Pagar ou Conta Corrente)
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.DEBITO, // Aumenta o ativo (Estoque de Metal)
          valor: valorBRL,
          moeda: 'BRL',
          descricao: notes || `Compra de metal do fornecedor ${supplierPessoaId}`,
          contaContabilId: settings.defaultMetalStockAccountId, // Conta de Estoque de Metal
          dataHora: new Date(),
        },
      });

      if (paymentMethod === 'A_VISTA') {
        if (!contaCorrenteId) {
          throw new BadRequestException('Conta corrente é obrigatória para pagamento à vista.');
        }
        await tx.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO, // Diminui o passivo (Conta Corrente)
            valor: valorBRL,
            moeda: 'BRL',
            descricao: notes || `Pagamento à vista de compra de metal do fornecedor ${supplierPessoaId}`,
            contaContabilId: settings.defaultContasAPagarContaId, // Ou uma conta de caixa/banco
            contaCorrenteId: contaCorrenteId,
            dataHora: new Date(),
          },
        });
      } else if (paymentMethod === 'A_PRAZO') {
        await tx.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO, // Aumenta o passivo (Contas a Pagar)
            valor: valorBRL,
            moeda: 'BRL',
            descricao: notes || `Compra a prazo de metal do fornecedor ${supplierPessoaId}`,
            contaContabilId: settings.defaultContasAPagarContaId, // Conta de Contas a Pagar
            dataHora: new Date(),
          },
        });
      }
    });
  }
}
