import { MetalAccountEntry } from '@prisma/client';

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

  // Calculate minimum possible date (credit creation or analysis date minus 24h timezone tolerance)
  const creditDateRaw = credit.date || credit.createdAt || new Date();
  const creditDate = new Date(creditDateRaw);
  const minDate = new Date(creditDate.getTime() - 24 * 60 * 60 * 1000);

  const numeroAnalise = credit.chemicalAnalysis?.numeroAnalise?.toString();
  const creditId = (credit.id || '').toLowerCase();

  // Filter candidates: only negative grams and on/after credit inception
  const candidates = allNegativeEntries.filter((entry) => {
    const entryGrams = Number(entry.grams);
    if (entryGrams >= 0) return false;

    const entryDate = new Date(entry.date);
    if (entryDate < minDate) return false;

    return true;
  });

  const matchedEntries: MetalAccountEntry[] = [];
  const matchedIds = new Set<string>();
  let accumulatedGrams = 0;

  // Pass 1: Explicit match by credit ID, Ref tag, or Analysis Number
  for (const entry of candidates) {
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
      numeroAnalise &&
      (desc.includes(`crr-${numeroAnalise.toLowerCase()}`) ||
        desc.includes(`crr ${numeroAnalise.toLowerCase()}`) ||
        desc.includes(`análise química ${numeroAnalise.toLowerCase()}`));

    if (isDirectMatch || isAnalysisMatch) {
      matchedEntries.push(entry);
      matchedIds.add(entry.id);
      accumulatedGrams += Math.abs(Number(entry.grams));
    }
  }

  // If explicit matches already cover the settled amount, return them
  if (accumulatedGrams >= settledGrams - 0.0001) {
    return matchedEntries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  // Pass 2: Match untagged legacy settlements (e.g. CASH_PAYMENT, CLIENT_CREDIT_PAYMENT, DEBIT)
  for (const entry of candidates) {
    if (matchedIds.has(entry.id)) continue;

    const desc = (entry.description || '').toLowerCase();
    const sourceId = (entry.sourceId || '').toLowerCase();

    // Skip if it explicitly references a different UUID or other CRR
    if (sourceId && sourceId.length === 36 && sourceId !== creditId) {
      // If it's an ADJUSTMENT with another sourceId, it belongs to another credit
      if (entry.type === 'ADJUSTMENT') continue;
    }

    if (desc.includes('ref:') && !desc.includes(creditId)) {
      continue;
    }

    // Skip if it mentions a different CRR number
    if (numeroAnalise && desc.includes('crr-') && !desc.includes(`crr-${numeroAnalise.toLowerCase()}`)) {
      continue;
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
