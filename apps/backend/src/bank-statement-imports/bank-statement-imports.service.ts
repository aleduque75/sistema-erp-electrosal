import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ofx from 'ofx-js';

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
      const parsedData = await ofx.parse(fileBuffer.toString());
      const transactionsFromFile =
        parsedData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN as OfxTransaction[];

      if (!transactionsFromFile || transactionsFromFile.length === 0) {
        return []; // Retorna array vazio se não houver transações
      }

      const isBalanceEntry = (memo: string) => {
        if (!memo) return false;
        memo = memo.toLowerCase();
        return (
            memo.includes('saldo') &&
            (memo.includes('total') || memo.includes('disponível') || memo.includes('anterior') || memo.includes('bloqueado') || memo.includes('bloq'))
        );
      };

      const filteredTransactions = transactionsFromFile.filter((t) => !isBalanceEntry(t.MEMO));

      const fitIdsFromFile = filteredTransactions.map((t) => t.FITID);

      const existingTransactions = await this.prisma.transacao.findMany({
        where: {
          contaCorrenteId: contaCorrenteId,
          fitId: {
            in: fitIdsFromFile,
          },
        },
        select: {
          fitId: true,
        },
      });
      const existingFitIds = new Set(existingTransactions.map((t) => t.fitId));
      
      // --- START: Nova Lógica de Sugestão ---
      
      // 1. Busca todos os fornecedores com suas contas padrão
      const suppliers = await this.prisma.fornecedor.findMany({
        where: {
          organizationId,
          defaultContaContabilId: { not: null },
        },
        include: {
          pessoa: {
            select: { name: true },
          },
        },
      });

      // 2. Busca sugestões do histórico de transações
      const newTransactionDescriptions = [
        ...new Set(
          filteredTransactions
            .filter((t) => !existingFitIds.has(t.FITID) && t.MEMO)
            .map((t) => t.MEMO),
        ),
      ];

      const suggestionsFromDb = await this.prisma.transacao.findMany({
        where: {
          organizationId,
          descricao: {
            in: newTransactionDescriptions,
          },
        },
        distinct: ['descricao'],
        orderBy: {
          dataHora: 'desc',
        },
        select: {
          descricao: true,
          contaContabilId: true,
        },
      });
      
      const historySuggestionMap = new Map<string, string>();
      suggestionsFromDb.filter(s => s.contaContabilId !== null).forEach((s) => {
        if (s.descricao && s.contaContabilId) {
          historySuggestionMap.set(s.descricao, s.contaContabilId);
        }
      });
      
      // --- END: Nova Lógica de Sugestão ---

      const previewList: PreviewTransaction[] = filteredTransactions.map(
        (t) => {
          const amount = parseFloat(t.TRNAMT);
          const dateString = t.DTPOSTED.substring(0, 8);
          const postedAt = new Date(
            `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`,
          );
          const status = existingFitIds.has(t.FITID) ? 'duplicate' : 'new';
          
          let suggestedContaContabilId: string | undefined = undefined;
          if (status === 'new') {
            const descriptionLowerCase = t.MEMO.toLowerCase();
            // Prioridade 1: Mapeamento do Fornecedor
            const matchedSupplier = suppliers.find(s => descriptionLowerCase.includes(s.pessoa.name.toLowerCase()));
            if(matchedSupplier) {
              suggestedContaContabilId = matchedSupplier.defaultContaContabilId!;
            } else {
              // Prioridade 2: Histórico de Transações
              suggestedContaContabilId = historySuggestionMap.get(t.MEMO);
            }
          }

          return {
            fitId: t.FITID,
            type: amount > 0 ? 'CREDIT' : 'DEBIT',
            amount: Math.abs(amount),
            description: t.MEMO,
            postedAt,
            status,
            suggestedContaContabilId,
          };
        },
      );

      return previewList;
    } catch (error) {
      console.error('Erro ao processar arquivo OFX:', error);
      throw new BadRequestException('Arquivo OFX inválido ou mal formatado.');
    }
  }
}
