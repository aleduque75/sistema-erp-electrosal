// packages/core/src/sales/sale.repository.ts
import { Sale } from "./sale.entity";

// ✅ CORRIGIDO: O tipo correto é Prisma.TransactionClient

export const ISaleRepository = "ISaleRepository";

export interface ISaleRepository {
  create(sale: Sale, tx?: unknown): Promise<void>;
  findAll(userId: string): Promise<Sale[]>;
  findById(id: string): Promise<Sale | null>;
}
