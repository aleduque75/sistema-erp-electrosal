export * from './domain/product';
// This is a placeholder for shared types, interfaces, etc.
export interface SharedType {
  id: string;
  name: string;
}
export * from './_shared';
export * from './domain/sales/sale.entity';
export * from './domain/sales/sale-installment.entity';
export * from './domain/sales/enums/sale-installment-status.enum';
export * from './domain/sales/sale.repository';
export * from './domain/sale-item/sale-item.entity'; // Correct SaleItem export
export * from './domain';
export * from './value-objects';
export * from './domain/metal-credits';
export * from './domain/recovery-orders';
export * from './domain/contas-metais';
export * from './domain/quotations';
export * from './domain/entities/pure-metal-lot.entity';
export * from './domain/entities/chemical-reaction.entity';
export * from './domain/entities/inventory-lot.entity'; // Adicionado
export * from './domain/repositories/ipure-metal-lot.repository';
export * from './domain/repositories/ichemical-reaction.repository';
export * from './domain/repositories/iinventory-lot.repository'; // Adicionado
export * from './domain/repositories/iproduct.repository'; // Adicionado
export * from './domain/enums'; // Adicionado

// Explicitly re-export from contas-metais for direct access
export { ContaMetal } from './domain/contas-metais/conta-metal.entity';
export { IContaMetalRepository } from './domain/contas-metais/repositories/iconta-metal.repository';
export { TipoMetal } from './domain/contas-metais/tipo-metal.enum';

// Explicitly re-export from _shared for direct access
export { UniqueEntityID } from './_shared/domain/unique-entity-id';