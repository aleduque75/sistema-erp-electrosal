export interface ChemicalReactionDetails {
  id: string;
  status: 'STARTED' | 'PROCESSING' | 'PENDING_PURITY' | 'PENDING_PURITY_ADJUSTMENT' | 'COMPLETED' | 'CANCELED';
  auUsedGrams: number;
  productionBatch: { batchNumber: string; product: { name: string } } | null;
  createdAt: string;
  updatedAt: string | null;
  outputProductGrams: number;
  lots: Array<{ id: string; initialGrams: number; remainingGrams: number; notes: string | null; }>;
}