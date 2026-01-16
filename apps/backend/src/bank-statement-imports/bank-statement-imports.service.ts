import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ofx from 'ofx-js';
import * as iconv from 'iconv-lite';

// Interface para definir o formato da resposta
export interface PreviewTransaction {
  fitId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  postedAt: Date;
  status: 'new' | 'duplicate';
  suggestedContaContabilId?: string;
}

interface OfxTransaction {
  TRNTYPE: 'CREDIT' | 'DEBIT';
  DTPOSTED: string;
  TRNAMT: string;
  FITID: string;
  MEMO: string;
}

@Injectable()
export class BankStatementImportsService {
  constructor(private prisma: PrismaService) {}

  async previewOfx(
    organizationId: string,
    fileBuffer: Buffer,
    contaCorrenteId: string,
  ): Promise<PreviewTransaction[]> {
    // Validação da conta corrente (continua igual)
    const contaCorrente = await this.prisma.contaCorrente.findFirst({
      where: { id: contaCorrenteId, organizationId },
    });
    if (!contaCorrente) {
      throw new BadRequestException('Conta corrente não encontrada.');
    }

try {
      const parsedData = await ofx.parse(fileBuffer.toString('latin1'));
      const transactionsFromFile =
        parsedData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN as OfxTransaction[];
      
      if (!transactionsFromFile || transactionsFromFile.length === 0) {
        return [];
      }

      const isBalanceEntry = (memo: string) => {
        if (!memo) return false;
        const lowerMemo = memo.toLowerCase();
        return (
          lowerMemo.includes('saldo') &&
          (lowerMemo.includes('total') ||
            lowerMemo.includes('disponível') ||
            lowerMemo.includes('anterior') ||
            lowerMemo.includes('bloqueado') ||
            lowerMemo.includes('bloq'))
        );
      };

      const filteredTransactions = transactionsFromFile.filter(
        (t) => !isBalanceEntry(t.MEMO),
      );

      // Busca TODAS as transações da conta corrente para uma verificação mais robusta
      const existingTransactions = await this.prisma.transacao.findMany({
        where: {
          contaCorrenteId: contaCorrenteId,
        },
        select: {
          dataHora: true,
          valor: true,
          descricao: true,
          fitId: true, // Ainda pode ser útil para referência
        },
      });

      // Cria um "hash" para cada transação existente para facilitar a busca
      const existingTransactionsSet = new Set(
        existingTransactions.map((t) => {
          const date = t.dataHora.toISOString().split('T')[0];
          const value = t.valor.toFixed(2);
          const key = `${date}|${value}`;
          return key;
        }),
      );
      
      const existingFitIds = new Set(existingTransactions.filter(t => t.fitId).map(t => t.fitId));


      const previewList: PreviewTransaction[] = filteredTransactions.map(
        (t) => {
          const amount = parseFloat(t.TRNAMT);
          const dateString = t.DTPOSTED.substring(0, 8);
          const postedAt = new Date(
            `${dateString.substring(0, 4)}-${dateString.substring(
              4,
              6,
            )}-${dateString.substring(6, 8)}T12:00:00.000Z`, // Adiciona um tempo para evitar problemas de fuso
          );

          const transactionDate = postedAt.toISOString().split('T')[0];
          
          // Chave primária de verificação
          const primaryKey = `${transactionDate}|${Math.abs(amount).toFixed(2)}`;
          
          let status: 'new' | 'duplicate' = 'new';
          const hasPrimaryKey = existingTransactionsSet.has(primaryKey);

          if (hasPrimaryKey || existingFitIds.has(t.FITID)) {
            status = 'duplicate';
          }
          
          return {
            fitId: t.FITID,
            type: amount >= 0 ? 'CREDIT' : 'DEBIT',
            amount: Math.abs(amount),
            description: t.MEMO,
            postedAt,
            status,
            suggestedContaContabilId: undefined, // Lógica de sugestão removida por enquanto para focar na duplicidade
          };
        },
      );

      // A lógica de sugestão pode ser re-adicionada aqui se necessário,
      // operando sobre a `previewList` filtrada.

      return previewList;
    } catch (error) {
      console.error('Erro ao processar arquivo OFX:', error);
      throw new BadRequestException('Arquivo OFX inválido ou mal formatado.');
    }
  }
}
