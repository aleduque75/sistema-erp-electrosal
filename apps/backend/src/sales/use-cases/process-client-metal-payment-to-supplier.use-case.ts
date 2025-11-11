import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoMetal, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { TipoTransacaoPrisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  IMetalAccountRepository,
  IMetalAccountEntryRepository,
  MetalAccountEntry,
} from '@sistema-erp-electrosal/core';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';

export interface ProcessClientMetalPaymentToSupplierCommand {
  organizationId: string;
  saleId: string;
  supplierPessoaId: string;
  grams: number;
  metalType: TipoMetal;
  notes?: string;
}

@Injectable()
export class ProcessClientMetalPaymentToSupplierUseCase {
  constructor(
    private prisma: PrismaService,
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
    @Inject('IMetalAccountEntryRepository')
    private readonly metalAccountEntryRepository: IMetalAccountEntryRepository,
    private readonly quotationsService: QuotationsService,
    private readonly settingsService: SettingsService,
  ) {}

  async execute(
    command: ProcessClientMetalPaymentToSupplierCommand,
  ): Promise<void> {
    const { organizationId, saleId, supplierPessoaId, grams, metalType, notes } = command;

    if (grams <= 0) {
      throw new BadRequestException(
        'A quantidade de metal deve ser maior que zero.',
      );
    }

    // 1. Encontrar a venda
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId, organizationId },
      include: { pessoa: true },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    // 2. Encontrar a MetalAccount do fornecedor
    const supplierMetalAccount =
      await this.metalAccountRepository.findByPersonId(
        supplierPessoaId,
        metalType,
        organizationId,
      );

    if (!supplierMetalAccount) {
      throw new NotFoundException(
        `Conta de metal do fornecedor ${supplierPessoaId} não encontrada.`,
      );
    }

    // 3. Encontrar a MetalAccount do cliente (para deduzir o saldo, se aplicável)
    const clientMetalAccount = await this.metalAccountRepository.findByPersonId(
      sale.pessoaId,
      metalType,
      organizationId,
    );

    if (!clientMetalAccount) {
      throw new NotFoundException(
        `Conta de metal do cliente ${sale.pessoaId} não encontrada.`,
      );
    }

    // 4. Verificar saldo do cliente (simplificado, idealmente buscar saldo agregado)
    // Por enquanto, vamos assumir que o saldo é suficiente e o repositório fará a validação

    // 5. Criar MetalAccountEntry para o fornecedor (aumenta o saldo do fornecedor com a empresa)
    const supplierMetalAccountEntry = MetalAccountEntry.create({
      metalAccountId: UniqueEntityID.create(supplierMetalAccount.id.toString()),
      date: new Date(),
      description:
        notes ||
        `Recebimento de metal do cliente ${sale.pessoaId} para a Venda #${sale.orderNumber}`,
      grams: new Decimal(grams).toNumber(), // Valor positivo para aumentar o saldo do fornecedor
      type: 'CLIENT_PAYMENT_TO_SUPPLIER',
      sourceId: saleId,
      organizationId,
    });

    // 6. Criar MetalAccountEntry para o cliente (diminui o saldo do cliente com a empresa)
    const clientMetalAccountEntry = MetalAccountEntry.create({
      metalAccountId: UniqueEntityID.create(clientMetalAccount.id.toString()),
      date: new Date(),
      description:
        notes ||
        `Pagamento da Venda #${sale.orderNumber} para o fornecedor ${supplierPessoaId}`,
      grams: new Decimal(grams).negated().toNumber(), // Valor negativo para deduzir do cliente
      type: 'CLIENT_PAYMENT_TO_SUPPLIER',
      sourceId: saleId,
      organizationId,
    });

    // 7. Criar Transação Financeira (em BRL) para registrar o pagamento da venda
    const latestQuote = await this.quotationsService.findLatest(
      metalType,
      organizationId,
      new Date(),
    );
    if (!latestQuote || latestQuote.buyPrice.lessThanOrEqualTo(0)) {
      throw new BadRequestException(
        `Nenhuma cotação de compra para ${metalType} encontrada para hoje.`,
      );
    }

    const valorBRL = new Decimal(grams).times(latestQuote.buyPrice);

    const settings = await this.settingsService.findOne(organizationId); // Assumindo que findOne pode buscar por organizationId
    if (
      !settings?.defaultReceitaContaId ||
      !settings?.defaultContasAPagarContaId!
    ) {
      throw new BadRequestException(
        'Contas contábeis padrão para Receita ou Contas a Pagar não configuradas.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.metalAccountEntryRepository.create(supplierMetalAccountEntry);
      await this.metalAccountEntryRepository.create(clientMetalAccountEntry);

      // Reduzir AccountsReceivable da venda (se houver)
      const accountsReceivable = await tx.accountRec.findMany({
        where: { saleId, organizationId, received: false }, // Assumindo status 'PENDING'
      });

      for (const ar of accountsReceivable) {
        // Para simplificar, vamos marcar como pago. Em um cenário real,
        // seria necessário calcular o valor pago e o restante.
        await tx.accountRec.update({
          where: { id: ar.id },
          data: {
            received: true, // Ou 'PARTIALLY_PAID' com ajuste de valor
            receivedAt: new Date(),
          },
        });
      }

      // Lançamento financeiro para a receita da venda (crédito na conta de receita)
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.CREDITO, // Receita da venda
          valor: valorBRL,
          moeda: 'BRL',
          descricao:
            notes ||
            `Pagamento de Venda #${sale.orderNumber} via fornecedor ${supplierPessoaId}`,
          contaContabilId: settings.defaultReceitaContaId!, // Conta de Receita
          dataHora: new Date(),
        },
      });

      // Lançamento financeiro para o aumento da dívida com o fornecedor (crédito em contas a pagar)
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.CREDITO, // Aumenta o passivo (dívida com fornecedor)
          valor: valorBRL,
          moeda: 'BRL',
          descricao:
            notes ||
            `Aumento de dívida com fornecedor ${supplierPessoaId} por pagamento de cliente`,
          contaContabilId: settings.defaultContasAPagarContaId!, // Conta de Contas a Pagar
          dataHora: new Date(),
        },
      });
    });
  }
}
