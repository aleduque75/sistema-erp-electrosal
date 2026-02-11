import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferFromSupplierAccountDto } from '../dtos/transfer-from-supplier-account.dto';
import { TipoMetal, TipoTransacaoPrisma, ContaCorrenteType, PureMetalLotStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { QuotationsService } from '../../quotations/quotations.service';

export interface TransferFromSupplierAccountToPureMetalLotsCommand {
  organizationId: string;
  dto: TransferFromSupplierAccountDto;
}

@Injectable()
export class TransferFromSupplierAccountToPureMetalLotsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationsService: QuotationsService,
  ) {}

  async execute(command: TransferFromSupplierAccountToPureMetalLotsCommand): Promise<any> {
    const { organizationId, dto } = command;
    const { supplierMetalAccountId, grams, notes, transferDate, goldQuoteValue } = dto; // Captura transferDate e goldQuoteValue

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

      // 2. Obter a cotação do ouro
      let goldSellPrice: Decimal;
      if (goldQuoteValue !== undefined) {
        goldSellPrice = new Decimal(goldQuoteValue);
      } else {
        const goldQuote = await this.quotationsService.findLatest(
          TipoMetal.AU,
          organizationId,
          transferDate, // Passa a data para buscar a cotação mais próxima
        );
        if (!goldQuote) {
          throw new BadRequestException('Nenhuma cotação de ouro encontrada para a data especificada.');
        }
        goldSellPrice = goldQuote.sellPrice;
      }
      const valueBRL = new Decimal(grams).times(goldSellPrice);

      // 3. Buscar contas contábeis necessárias
      const contaEstoqueOuro = await tx.contaContabil.findFirstOrThrow({
        where: { organizationId, codigo: '1.1.2' }, // Exemplo: 1.1.2 para Estoque de Ouro
      });
      const contaPassivoFornecedor = await tx.contaContabil.findFirstOrThrow({
        where: { organizationId, codigo: '2.1.1' }, // Exemplo: 2.1.1 para Passivo de Fornecedores de Metal
      });

      // 4. Registrar a transação de débito na conta corrente do fornecedor (saída de ouro)
      // Esta transação representa a diminuição da dívida/obrigação da empresa com o fornecedor em ouro
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.DEBITO, // Débito na conta do fornecedor (passivo diminui)
          valor: valueBRL.toNumber(),
          moeda: 'BRL',
          goldAmount: grams,
          descricao: `Transferência de Ouro para Estoque: ${notes}`,
          dataHora: transferDate || new Date(), // Usa a data da transferência ou a data atual
          contaContabilId: contaPassivoFornecedor.id, // Conta contábil do passivo do fornecedor
          contaCorrenteId: supplierMetalAccountId,
        },
      });

      // 5. Criar um novo pure_metal_lot (entrada no estoque da empresa)
      await tx.pure_metal_lots.create({
        data: {
          organizationId,
          sourceType: 'SUPPLIER_ACCOUNT_TRANSFER',
          sourceId: supplierMetalAccountId,
          metalType: TipoMetal.AU,
          initialGrams: grams,
          remainingGrams: grams,
          purity: 1, // Assumindo pureza 100% para ouro transferido
          notes: `Transferência da Conta Fornecedor ${supplierAccount.nome}: ${notes}`,
          entryDate: transferDate || new Date(), // Usa a data da transferência ou a data atual
        },
      });

      // 6. Registrar a transação de crédito na conta de estoque de ouro (entrada de ouro)
      // Esta transação representa o aumento do ativo da empresa em ouro
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.CREDITO, // Crédito na conta de estoque de ouro (ativo aumenta)
          valor: valueBRL.toNumber(),
          moeda: 'BRL',
          goldAmount: grams,
          descricao: `Entrada de Ouro no Estoque via Transferência de Fornecedor: ${notes}`,
          dataHora: transferDate || new Date(), // Usa a data da transferência ou a data atual
          contaContabilId: contaEstoqueOuro.id, // Conta contábil do ativo de estoque de ouro
        },
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
