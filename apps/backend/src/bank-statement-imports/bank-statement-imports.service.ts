import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
  goldPrice?: number | null;
  goldAmount?: number | null;
  matchedDate?: string | null;
  matchedDescription?: string | null;
}

interface OfxTransaction {
  TRNTYPE: 'CREDIT' | 'DEBIT' | string;
  DTPOSTED: string;
  TRNAMT: string;
  FITID: string;
  MEMO?: string;
  NAME?: string;
}

@Injectable()
export class BankStatementImportsService {
  private readonly logger = new Logger(BankStatementImportsService.name);

  constructor(private prisma: PrismaService) {}

  private decodeOfxBuffer(fileBuffer: Buffer): string {
    const utf8 = fileBuffer.toString('utf-8');
    if (!utf8.includes('\uFFFD')) {
      return utf8;
    }
    return iconv.decode(fileBuffer, 'windows-1252');
  }

  private sanitizeOfxString(content: string): string {
    // 1. Substitui '&' que não seja entidade XML válida por '&amp;'
    let sanitized = content.replace(
      /&(?!(amp|lt|gt|quot|apos|#\d+|#x[a-fA-F0-9]+);)/g,
      '&amp;',
    );

    // 2. Remove caracteres de controle estranhos (exceto \r, \n, \t)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    return sanitized;
  }

  private extractTransactions(parsedData: any): OfxTransaction[] {
    const bankMsgs = parsedData?.OFX?.BANKMSGSRSV1;
    const ccMsgs = parsedData?.OFX?.CREDITCARDMSGSRSV1;

    let stmtTrnRs = bankMsgs?.STMTTRNRS || ccMsgs?.CCSTMTTRNRS;
    if (!stmtTrnRs) return [];

    if (!Array.isArray(stmtTrnRs)) {
      stmtTrnRs = [stmtTrnRs];
    }

    const allTransactions: OfxTransaction[] = [];

    for (const trnRs of stmtTrnRs) {
      const stmtRs = trnRs?.STMTRS || trnRs?.CCSTMTRS;
      const bankTranList = stmtRs?.BANKTRANLIST;
      const stmtTrn = bankTranList?.STMTTRN;
      if (!stmtTrn) continue;

      if (Array.isArray(stmtTrn)) {
        allTransactions.push(...stmtTrn);
      } else {
        allTransactions.push(stmtTrn);
      }
    }

    return allTransactions;
  }

  async previewOfx(
    organizationId: string,
    fileBuffer: Buffer,
    contaCorrenteId: string,
  ): Promise<PreviewTransaction[]> {
    // Validação da conta corrente
    const contaCorrente = await this.prisma.contaCorrente.findFirst({
      where: { id: contaCorrenteId, organizationId },
    });
    if (!contaCorrente) {
      throw new BadRequestException('Conta corrente não encontrada.');
    }

    try {
      const decodedString = this.decodeOfxBuffer(fileBuffer);
      const sanitizedString = this.sanitizeOfxString(decodedString);
      const parsedData = await ofx.parse(sanitizedString);
      const transactionsFromFile = this.extractTransactions(parsedData);

      if (!transactionsFromFile || transactionsFromFile.length === 0) {
        return [];
      }

      const isBalanceEntry = (memo?: string) => {
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
        (t) => !isBalanceEntry(t.MEMO || t.NAME),
      );

      // Busca TODAS as transações da conta corrente para conciliação robusta
      const existingTransactions = await this.prisma.transacao.findMany({
        where: {
          contaCorrenteId: contaCorrenteId,
        },
        select: {
          id: true,
          dataHora: true,
          valor: true,
          tipo: true,
          descricao: true,
          fitId: true,
        },
      });

      // Cria um pool de transações existentes para matching 1-para-1 com tolerância de datas
      interface ExistingPoolItem {
        id: string;
        dateStr: string; // YYYY-MM-DD
        dateMs: number;
        valor: number;
        tipo: string; // 'CREDITO' | 'DEBITO'
        descricao: string | null;
        fitId: string | null;
        used: boolean;
      }

      const existingPool: ExistingPoolItem[] = existingTransactions.map((tx) => {
        const dateStr = tx.dataHora.toISOString().split('T')[0];
        const dateMs = new Date(`${dateStr}T12:00:00.000Z`).getTime();
        return {
          id: tx.id,
          dateStr,
          dateMs,
          valor: Math.round(Math.abs(Number(tx.valor)) * 100) / 100,
          tipo: String(tx.tipo).toUpperCase(),
          descricao: tx.descricao,
          fitId: tx.fitId || null,
          used: false,
        };
      });

      // Busca cotações de Ouro (AU) para calcular cotação do dia e peso em metal
      const quotations = await this.prisma.quotation.findMany({
        where: { organizationId, metal: 'AU' },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });

      // Processa itens do OFX com dados padronizados
      const parsedOfxItems = filteredTransactions.map((t, index) => {
        const rawAmt = String(t.TRNAMT || '0').replace(',', '.');
        const amount = parseFloat(rawAmt);
        const rawDate = String(t.DTPOSTED || '').trim();
        const dateString = rawDate.length >= 8 ? rawDate.substring(0, 8) : '';
        const postedAt =
          dateString.length === 8
            ? new Date(
                `${dateString.substring(0, 4)}-${dateString.substring(
                  4,
                  6,
                )}-${dateString.substring(6, 8)}T12:00:00.000Z`,
              )
            : new Date();
        const transactionDate = postedAt.toISOString().split('T')[0];
        const ofxDateMs = new Date(`${transactionDate}T12:00:00.000Z`).getTime();
        const ofxAmount = Math.round(Math.abs(amount) * 100) / 100;
        const ofxType = amount >= 0 ? 'CREDITO' : 'DEBITO';
        const description = (t.MEMO || t.NAME || 'Transação sem descrição').trim();

        return {
          raw: t,
          index,
          amount,
          ofxAmount,
          ofxType,
          description,
          postedAt,
          transactionDate,
          ofxDateMs,
          status: 'new' as 'new' | 'duplicate',
          matchedDate: null as string | null,
          matchedDescription: null as string | null,
        };
      });

      // Passo 1: Match prioritário por FITID idêntico (transação já importada anteriormente)
      for (const item of parsedOfxItems) {
        if (item.raw.FITID) {
          const match = existingPool.find(
            (p) => !p.used && p.fitId === item.raw.FITID,
          );
          if (match) {
            match.used = true;
            item.status = 'duplicate';
            item.matchedDate = match.dateStr;
            item.matchedDescription = match.descricao;
          }
        }
      }

      // Passo 2: Match exato por Data e Valor e Tipo (lançado no mesmo dia)
      for (const item of parsedOfxItems) {
        if (item.status === 'new') {
          const match = existingPool.find(
            (p) =>
              !p.used &&
              p.valor === item.ofxAmount &&
              p.tipo === item.ofxType &&
              p.dateStr === item.transactionDate,
          );
          if (match) {
            match.used = true;
            item.status = 'duplicate';
            item.matchedDate = match.dateStr;
            item.matchedDescription = match.descricao;
          }
        }
      }

      // Passo 3: Match inteligente por aproximação de datas (janela de tolerância de até ±3 dias)
      // Ex: OFX dia 11/01 e lançamento no sistema dia 12/01, ou fim de semana (sexta a segunda)
      for (const item of parsedOfxItems) {
        if (item.status === 'new') {
          const candidates = existingPool
            .filter(
              (p) =>
                !p.used &&
                p.valor === item.ofxAmount &&
                p.tipo === item.ofxType,
            )
            .map((p) => {
              const diffDays = Math.abs(
                Math.round((p.dateMs - item.ofxDateMs) / (1000 * 60 * 60 * 24)),
              );
              return { poolItem: p, diffDays };
            })
            .filter((c) => c.diffDays <= 3)
            .sort((a, b) => a.diffDays - b.diffDays);

          if (candidates.length > 0) {
            const bestMatch = candidates[0].poolItem;
            bestMatch.used = true;
            item.status = 'duplicate';
            item.matchedDate = bestMatch.dateStr;
            item.matchedDescription = bestMatch.descricao;
          }
        }
      }

      // Monta lista final com cotações e metadados de conciliação
      const previewList: PreviewTransaction[] = parsedOfxItems.map((item) => {
        const matchQuote = quotations.find((q) => {
          const qDate = new Date(q.date).toISOString().split('T')[0];
          return qDate <= item.transactionDate;
        });
        const effectiveQuote =
          matchQuote || (quotations.length > 0 ? quotations[0] : null);
        const goldPrice = effectiveQuote
          ? Number(effectiveQuote.buyPrice || effectiveQuote.sellPrice)
          : null;
        const goldAmount =
          goldPrice && goldPrice > 0
            ? Number((item.ofxAmount / goldPrice).toFixed(4))
            : null;

        return {
          fitId: item.raw.FITID || `${item.transactionDate}-${item.ofxAmount}-${item.index}`,
          type: item.amount >= 0 ? 'CREDIT' : 'DEBIT',
          amount: item.ofxAmount,
          description: item.description,
          postedAt: item.postedAt,
          status: item.status,
          suggestedContaContabilId: undefined,
          goldPrice,
          goldAmount,
          matchedDate: item.matchedDate,
          matchedDescription: item.matchedDescription,
        };
      });

      return previewList;
    } catch (error: any) {
      this.logger.error('Erro ao processar arquivo OFX:', error?.stack || error);
      throw new BadRequestException(
        `Arquivo OFX inválido ou mal formatado: ${error?.message || 'Erro desconhecido'}`,
      );
    }
  }
}
