import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferFromSupplierAccountDto } from '../dtos/transfer-from-supplier-account.dto';
import { TipoMetal, TipoTransacaoPrisma, ContaCorrenteType, PureMetalLotStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { QuotationsService } from '../../quotations/quotations.service';
import { CreatePureMetalLotUseCase } from '../../pure-metal-lots/use-cases/create-pure-metal-lot.use-case';

export interface TransferFromSupplierAccountToPureMetalLotsCommand {
  organizationId: string;
  dto: TransferFromSupplierAccountDto;
}

@Injectable()
export class TransferFromSupplierAccountToPureMetalLotsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationsService: QuotationsService,
    private readonly createPureMetalLotUseCase: CreatePureMetalLotUseCase,
  ) {}

  async execute(command: TransferFromSupplierAccountToPureMetalLotsCommand): Promise<any> {
    const { organizationId, dto } = command;
    const {
      supplierMetalAccountId,
      grams,
      notes,
      transferDate,
      goldQuoteValue,
      metalType = TipoMetal.AU,
      metalGrams,
      metalQuoteValue,
      totalValueBRL,
      goldEquivalentGrams,
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Validar a conta corrente do fornecedor de metal
      const supplierAccount = await tx.contaCorrente.findUnique({
        where: { id: supplierMetalAccountId, organizationId },
      });

      if (!supplierAccount) {
        throw new NotFoundException(`Conta corrente de fornecedor de metal com ID ${supplierMetalAccountId} não encontrada.`);
      }

      if (supplierAccount.type !== ContaCorrenteType.FORNECEDOR_METAL) {
        throw new BadRequestException(`A conta ${supplierMetalAccountId} não é do tipo FORNECEDOR_METAL.`);
      }

      // 2. Buscar contas contábeis necessárias
      const contaEstoqueOuro = await tx.contaContabil.findFirstOrThrow({
        where: { organizationId, codigo: '1.1.2' },
      });
      const contaPassivoFornecedor = await tx.contaContabil.findFirstOrThrow({
        where: { organizationId, codigo: '2.1.1' },
      });

      if (metalType === TipoMetal.AG) {
        // FLUXO DE TRANSFERÊNCIA DE PRATA (AG) COM CONTROLE EM OURO (AU)
        const agGrams = metalGrams || grams;
        if (!agGrams || agGrams <= 0) {
          throw new BadRequestException('A quantidade de prata deve ser maior que zero.');
        }

        // Cotação da Prata
        let silverSellPrice: Decimal;
        if (metalQuoteValue !== undefined && metalQuoteValue > 0) {
          silverSellPrice = new Decimal(metalQuoteValue);
        } else {
          const silverQuote = await this.quotationsService.findLatest(
            TipoMetal.AG,
            organizationId,
            transferDate,
          );
          if (!silverQuote || !silverQuote.sellPrice) {
            throw new BadRequestException('Nenhuma cotação de prata encontrada para a data especificada. Por favor, informe a cotação manualmente.');
          }
          silverSellPrice = new Decimal(silverQuote.sellPrice);
        }

        // Valor financeiro total em R$
        let calculatedValueBRL: Decimal;
        if (totalValueBRL !== undefined && totalValueBRL > 0) {
          calculatedValueBRL = new Decimal(totalValueBRL);
        } else {
          calculatedValueBRL = new Decimal(agGrams).times(silverSellPrice);
        }

        // Cotação do Ouro para conversão do débito
        let goldSellPrice: Decimal;
        if (goldQuoteValue !== undefined && goldQuoteValue > 0) {
          goldSellPrice = new Decimal(goldQuoteValue);
        } else {
          const goldQuote = await this.quotationsService.findLatest(
            TipoMetal.AU,
            organizationId,
            transferDate,
          );
          if (!goldQuote || !goldQuote.sellPrice) {
            throw new BadRequestException('Nenhuma cotação de ouro encontrada para a conversão da conta corrente. Por favor, informe a cotação do ouro manualmente.');
          }
          goldSellPrice = new Decimal(goldQuote.sellPrice);
        }

        // Equivalente em gramas de ouro
        let auEquivalentGrams: number;
        if (goldEquivalentGrams !== undefined && goldEquivalentGrams > 0) {
          auEquivalentGrams = goldEquivalentGrams;
        } else {
          auEquivalentGrams = calculatedValueBRL.dividedBy(goldSellPrice).toDecimalPlaces(4).toNumber();
        }

        const formattedAgGrams = agGrams.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
        const formattedAgQuote = silverSellPrice.toNumber().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedBRL = calculatedValueBRL.toNumber().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedAuGrams = auEquivalentGrams.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        const formattedAuQuote = goldSellPrice.toNumber().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const txDescription = `Transferência de Prata para Estoque: ${formattedAgGrams}g Ag @ R$ ${formattedAgQuote}/g (R$ ${formattedBRL}) = ${formattedAuGrams}g Au @ R$ ${formattedAuQuote}/g${notes ? `. ${notes}` : ''}`;

        // 3. Registrar o DÉBITO na conta do fornecedor (em Ouro e R$)
        const debitoTransacao = await tx.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.DEBITO,
            valor: calculatedValueBRL.toNumber(),
            moeda: 'BRL',
            goldAmount: auEquivalentGrams, // Controlado em Au
            descricao: txDescription,
            dataHora: transferDate || new Date(),
            contaContabilId: contaPassivoFornecedor.id,
            contaCorrenteId: supplierMetalAccountId,
          },
        });

        // 4. Criar o lote em pure_metal_lots de PRATA (AG) vinculado à transação
        await this.createPureMetalLotUseCase.execute(
          organizationId,
          {
            sourceType: 'SUPPLIER_ACCOUNT_TRANSFER',
            sourceId: debitoTransacao.id,
            metalType: TipoMetal.AG,
            initialGrams: agGrams,
            remainingGrams: agGrams,
            purity: 1,
            notes: `Transferência da Conta Fornecedor ${supplierAccount.nome}: ${formattedAgGrams}g Ag @ R$ ${formattedAgQuote}/g (R$ ${formattedBRL} = ${formattedAuGrams}g Au @ R$ ${formattedAuQuote}/g)${notes ? `. ${notes}` : ''}`,
            entryDate: (transferDate ? new Date(transferDate) : new Date()).toISOString(),
          },
          tx,
        );

        // 5. Crédito contábil
        const creditoTransacao = await tx.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO,
            valor: calculatedValueBRL.toNumber(),
            moeda: 'BRL',
            goldAmount: auEquivalentGrams,
            descricao: `Entrada de Prata no Estoque via Transferência de Fornecedor: ${formattedAgGrams}g Ag${notes ? `. ${notes}` : ''}`,
            dataHora: transferDate || new Date(),
            contaContabilId: contaEstoqueOuro.id,
            linkedTransactionId: debitoTransacao.id,
          },
        });

        await tx.transacao.update({
          where: { id: debitoTransacao.id },
          data: { linkedTransactionId: creditoTransacao.id },
        });

        return { message: 'Transferência de Prata realizada com sucesso.' };
      }

      // FLUXO PADRÃO (OURO - AU)
      let goldSellPrice: Decimal;
      if (goldQuoteValue !== undefined && goldQuoteValue > 0) {
        goldSellPrice = new Decimal(goldQuoteValue);
      } else {
        const goldQuote = await this.quotationsService.findLatest(
          TipoMetal.AU,
          organizationId,
          transferDate,
        );
        if (!goldQuote || !goldQuote.sellPrice) {
          throw new BadRequestException('Nenhuma cotação de ouro encontrada para a data especificada. Por favor, informe a cotação manualmente.');
        }
        goldSellPrice = new Decimal(goldQuote.sellPrice);
      }
      const valueBRL = new Decimal(grams).times(goldSellPrice);

      // Registrar a transação de débito na conta corrente do fornecedor (saída de ouro)
      const debitoTransacao = await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: valueBRL.toNumber(),
          moeda: 'BRL',
          goldAmount: grams,
          descricao: `Transferência de Ouro para Estoque: ${notes || ''}`,
          dataHora: transferDate || new Date(),
          contaContabilId: contaPassivoFornecedor.id,
          contaCorrenteId: supplierMetalAccountId,
        },
      });

      // Criar um novo pure_metal_lot de OURO (AU) vinculado à transação
      await this.createPureMetalLotUseCase.execute(
        organizationId,
        {
          sourceType: 'SUPPLIER_ACCOUNT_TRANSFER',
          sourceId: debitoTransacao.id,
          metalType: TipoMetal.AU,
          initialGrams: grams,
          remainingGrams: grams,
          purity: 1,
          notes: `Transferência da Conta Fornecedor ${supplierAccount.nome}: ${notes || ''}`,
          entryDate: (transferDate ? new Date(transferDate) : new Date()).toISOString(),
        },
        tx,
      );

      // Registrar a transação de crédito na conta de estoque
      const creditoTransacao = await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: valueBRL.toNumber(),
          moeda: 'BRL',
          goldAmount: grams,
          descricao: `Entrada de Ouro no Estoque via Transferência de Fornecedor: ${notes || ''}`,
          dataHora: transferDate || new Date(),
          contaContabilId: contaEstoqueOuro.id,
          linkedTransactionId: debitoTransacao.id,
        },
      });

      await tx.transacao.update({
        where: { id: debitoTransacao.id },
        data: { linkedTransactionId: creditoTransacao.id },
      });

      return { message: 'Transferência realizada com sucesso.' };
    });
  }

  private async calculateAccountGoldBalance(tx: any, accountId: string): Promise<number> {
    const transactions = await tx.transacao.findMany({
      where: { contaCorrenteId: accountId, moeda: 'AU' },
      select: { tipo: true, goldAmount: true },
    });

    let balance = new Decimal(0);
    for (const t of transactions) {
      if (t.tipo === TipoTransacaoPrisma.CREDITO) {
        balance = balance.plus(t.goldAmount || 0);
      } else if (t.tipo === TipoTransacaoPrisma.DEBITO) {
        balance = balance.minus(t.goldAmount || 0);
      }
    }
    return balance.toNumber();
  }
}
