import { Sale } from './sale.entity';

export abstract class ISaleRepository {
  abstract create(sale: Sale): Promise<void>;
  abstract findById(id: string): Promise<Sale | null>;
  // ... outros métodos como findAll, update, delete
}