import { MetalAccountEntry } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalAccountEntryDto, SaleUsageDto } from '../dtos/metal-credit-with-usage.dto';

export interface CreditForUsageFiltering {
  id?: string;
  clientId: string;
  metalType: string;
  grams: any;
  settledGrams?: any;
  date: Date | string;
  createdAt?: Date | string;
  chemicalAnalysisId?: string | null;
  chemicalAnalysis?: {
    id?: string;
    numeroAnalise?: string | number | null;
    dataEntrada?: Date | string | null;
    createdAt?: Date | string | null;
  } | null;
}

export function filterEntriesForCredit(
  credit: CreditForUsageFiltering,
  allNegativeEntries: MetalAccountEntry[],
  transactionDescriptionsMap?: Map<string, string>,
): MetalAccountEntry[] {
  const settledGrams = Number(credit.settledGrams || 0);

  // If nothing was settled on this credit, it cannot have usage entries
  if (settledGrams <= 0.0001) {
    return [];
  }

  // Calculate candidate dates: check credit date, createdAt, chemicalAnalysis dataEntrada, createdAt
  const candidateDates = [
    credit.date ? new Date(credit.date).getTime() : NaN,
    credit.createdAt ? new Date(credit.createdAt).getTime() : NaN,
    credit.chemicalAnalysis?.dataEntrada ? new Date(credit.chemicalAnalysis.dataEntrada).getTime() : NaN,
    credit.chemicalAnalysis?.createdAt ? new Date(credit.chemicalAnalysis.createdAt).getTime() : NaN,
  ].filter((t) => !isNaN(t));

  // Generous buffer (30 days before inception/entry date) for untagged legacy matches
  const minTimestamp = candidateDates.length > 0
    ? Math.min(...candidateDates) - 30 * 24 * 60 * 60 * 1000
    : 0;
  const minDate = new Date(minTimestamp);

  const rawNumero = credit.chemicalAnalysis?.numeroAnalise?.toString() || '';
  const cleanNumero = rawNumero.replace(/^[#\s]*crr-?/i, '').trim().toLowerCase();
  const creditId = (credit.id || '').toLowerCase();

  const matchedEntries: MetalAccountEntry[] = [];
  const matchedIds = new Set<string>();
  let accumulatedGrams = 0;

  // Pass 1: Explicit match by credit ID, Ref tag, or Analysis Number across ALL entries
  for (const entry of allNegativeEntries) {
    const entryGrams = Number(entry.grams);
    if (entryGrams >= 0) continue;

    const desc = (entry.description || '').toLowerCase();
    const sourceId = (entry.sourceId || '').toLowerCase();
    const txDesc = entry.sourceId && transactionDescriptionsMap
      ? (transactionDescriptionsMap.get(entry.sourceId) || '').toLowerCase()
      : '';

    const isDirectMatch =
      Boolean(creditId && creditId.length >= 8) &&
      (sourceId === creditId ||
        desc.includes(creditId) ||
        desc.includes(`ref:${creditId}`) ||
        txDesc.includes(creditId) ||
        txDesc.includes(`ref:${creditId}`));

    const isAnalysisMatch =
      cleanNumero.length > 0 &&
      (desc.includes(`crr-${cleanNumero}`) ||
        desc.includes(`crr ${cleanNumero}`) ||
        desc.includes(`crr${cleanNumero}`) ||
        desc.includes(`análise química ${cleanNumero}`) ||
        desc.includes(`analise quimica ${cleanNumero}`) ||
        desc.includes(`análise ${cleanNumero}`) ||
        desc.includes(`analise ${cleanNumero}`) ||
        (rawNumero && desc.includes(rawNumero.toLowerCase())) ||
        (txDesc && cleanNumero && txDesc.includes(cleanNumero)));

    if (isDirectMatch || isAnalysisMatch) {
      matchedEntries.push(entry);
      matchedIds.add(entry.id);
      accumulatedGrams += Math.abs(entryGrams);
    }
  }

  // If explicit matches already cover the settled amount, return them
  if (accumulatedGrams >= settledGrams - 0.0001) {
    return matchedEntries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  // Pass 2: Match untagged legacy settlements (e.g. CASH_PAYMENT, CLIENT_CREDIT_PAYMENT, DEBIT)
  // Only consider candidates on or after minDate that haven't matched yet
  const candidates = allNegativeEntries.filter((entry) => {
    if (matchedIds.has(entry.id)) return false;
    const entryGrams = Number(entry.grams);
    if (entryGrams >= 0) return false;

    const entryDate = new Date(entry.date);
    if (entryDate < minDate) return false;

    return true;
  });

  for (const entry of candidates) {
    if (matchedIds.has(entry.id)) continue;

    const desc = (entry.description || '').toLowerCase();
    const sourceId = (entry.sourceId || '').toLowerCase();

    // Skip if it explicitly references a different UUID or other CRR
    if (sourceId && sourceId.length === 36 && sourceId !== creditId) {
      if (entry.type === 'ADJUSTMENT') continue;
    }

    if (desc.includes('ref:') && !desc.includes(creditId)) {
      continue;
    }

    // Skip if it mentions a DIFFERENT CRR number
    if (desc.includes('crr-') || desc.includes('crr ')) {
      const hasThisCrr =
        cleanNumero &&
        (desc.includes(`crr-${cleanNumero}`) ||
          desc.includes(`crr ${cleanNumero}`) ||
          desc.includes(`crr${cleanNumero}`));
      if (!hasThisCrr) {
        continue;
      }
    }

    const entryAbsGrams = Math.abs(Number(entry.grams));
    const remainingToMatch = settledGrams - accumulatedGrams;

    // Check if this entry fits within the remaining settled grams
    if (entryAbsGrams <= remainingToMatch + 0.0005) {
      matchedEntries.push(entry);
      matchedIds.add(entry.id);
      accumulatedGrams += entryAbsGrams;

      if (accumulatedGrams >= settledGrams - 0.0001) {
        break;
      }
    }
  }

  return matchedEntries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function enrichUsageEntry(
  prisma: PrismaService,
  dbEntry: MetalAccountEntry,
): Promise<MetalAccountEntryDto> {
  let saleUsage: SaleUsageDto | undefined;
  let paymentDate: Date | undefined;
  let paymentValueBRL: number | undefined;
  let paymentQuotation: number | undefined;
  let paymentSourceAccountName: string | undefined;
  let isPaid: boolean | undefined;

  const entryGrams = typeof dbEntry.grams === 'number'
    ? dbEntry.grams
    : (dbEntry.grams as any)?.toNumber?.() ?? Number(dbEntry.grams);

  try {
    if (dbEntry.type === 'SALE_PAYMENT' && dbEntry.sourceId) {
      const sale = await prisma.sale.findUnique({
        where: { id: dbEntry.sourceId },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          totalAmount: true,
          accountsRec: {
            select: {
              received: true,
              transacoes: {
                select: {
                  dataHora: true,
                  valor: true,
                  goldPrice: true,
                  contaCorrente: { select: { nome: true } },
                },
                take: 1,
              },
            },
            take: 1,
          },
        },
      });

      if (sale) {
        const saleAmount = typeof sale.totalAmount === 'number'
          ? sale.totalAmount
          : (sale.totalAmount as any)?.toNumber?.() ?? Number(sale.totalAmount);

        saleUsage = {
          id: sale.id,
          orderNumber: sale.orderNumber,
          saleDate: sale.createdAt,
          totalAmount: saleAmount,
        };

        if (sale.accountsRec && sale.accountsRec.length > 0) {
          const accountRec = sale.accountsRec[0];
          isPaid = accountRec.received;
          if (accountRec.transacoes && accountRec.transacoes.length > 0) {
            const transaction = accountRec.transacoes[0];
            paymentDate = transaction.dataHora;
            paymentValueBRL = typeof transaction.valor === 'number'
              ? transaction.valor
              : (transaction.valor as any)?.toNumber?.() ?? Number(transaction.valor);
            paymentQuotation = typeof transaction.goldPrice === 'number'
              ? transaction.goldPrice
              : (transaction.goldPrice as any)?.toNumber?.() ?? (transaction.goldPrice ? Number(transaction.goldPrice) : undefined);
            paymentSourceAccountName = transaction.contaCorrente?.nome;
          }
        }

        if (!paymentSourceAccountName) {
          paymentSourceAccountName = `Pedido #${sale.orderNumber}`;
        }
      }
    } else if (
      (dbEntry.type === 'CASH_PAYMENT' || dbEntry.type === 'CLIENT_CREDIT_PAYMENT') &&
      dbEntry.sourceId
    ) {
      const debitTransaction = await prisma.transacao.findUnique({
        where: { id: dbEntry.sourceId },
        include: {
          contaCorrente: true,
          contaContabil: true,
        },
      });

      let linkedTransaction: any = null;
      if (debitTransaction && debitTransaction.linkedTransactionId) {
        linkedTransaction = await prisma.transacao.findUnique({
          where: { id: debitTransaction.linkedTransactionId },
          include: {
            contaCorrente: true,
            contaContabil: true,
          },
        });
      }

      // Check which transaction has the bank account or accounting account
      const txWithAccount: any =
        linkedTransaction?.contaCorrente
          ? linkedTransaction
          : debitTransaction?.contaCorrente
          ? debitTransaction
          : linkedTransaction?.contaContabil
          ? linkedTransaction
          : debitTransaction;

      if (txWithAccount) {
        paymentDate = txWithAccount.dataHora || dbEntry.date;
        paymentValueBRL = typeof txWithAccount.valor === 'number'
          ? txWithAccount.valor
          : (txWithAccount.valor as any)?.toNumber?.() ?? Number(txWithAccount.valor);
        paymentQuotation = typeof txWithAccount.goldPrice === 'number'
          ? txWithAccount.goldPrice
          : (txWithAccount.goldPrice as any)?.toNumber?.() ?? (txWithAccount.goldPrice ? Number(txWithAccount.goldPrice) : undefined);

        paymentSourceAccountName =
          txWithAccount.contaCorrente?.nome ||
          txWithAccount.contaContabil?.nome ||
          (dbEntry.type === 'CASH_PAYMENT' ? 'Caixa / Pagamento em Dinheiro' : 'Crédito de Cliente');
        isPaid = true;
      }
    } else if (
      (dbEntry.type === 'DEBIT' || dbEntry.type === 'METAL_PAYMENT') &&
      dbEntry.sourceId
    ) {
      const movement = await prisma.pureMetalLotMovement.findUnique({
        where: { id: dbEntry.sourceId },
        include: { pureMetalLot: true },
      });
      if (movement?.pureMetalLot?.lotNumber) {
        paymentSourceAccountName = `Lote Físico: ${movement.pureMetalLot.lotNumber}`;
      } else if (movement?.pureMetalLot) {
        paymentSourceAccountName = `Lote Físico (${movement.pureMetalLot.metalType || 'AU'})`;
      } else {
        paymentSourceAccountName = 'Entrega de Metal Físico (Estoque)';
      }
    } else if (dbEntry.type === 'ADJUSTMENT') {
      paymentSourceAccountName = 'Liquidação / Ajuste de Saldo Residual';
      isPaid = true;
    }

    // Fallback if paymentSourceAccountName is still not resolved
    if (!paymentSourceAccountName) {
      if (dbEntry.type === 'CASH_PAYMENT') {
        paymentSourceAccountName = 'Pagamento em Dinheiro';
      } else if (dbEntry.type === 'ADJUSTMENT') {
        paymentSourceAccountName = 'Ajuste de Saldo';
      } else {
        paymentSourceAccountName = dbEntry.description || 'Movimentação de Saldo';
      }
    }
  } catch (err) {
    // Graceful fallback on error
    if (!paymentSourceAccountName) {
      paymentSourceAccountName = dbEntry.description || 'Compensação';
    }
  }

  return {
    id: dbEntry.id,
    date: dbEntry.date,
    description: dbEntry.description,
    grams: entryGrams,
    type: dbEntry.type,
    sourceId: dbEntry.sourceId || undefined,
    sale: saleUsage,
    paymentDate,
    paymentValueBRL,
    paymentQuotation,
    paymentSourceAccountName,
    isPaid,
  };
}
