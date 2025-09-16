// This is a placeholder for shared types, interfaces, etc.
export interface SharedType {
  id: string;
  name: string;
}
export * from './_shared';
export * from './domain/sales';
export * from './domain';
export * from './value-objects';
export * from './domain/metal-credits';
export * from './domain/recovery-orders';
export * from './domain/contas-metais';

// Explicitly re-export from contas-metais for direct access
export { ContaMetal } from './domain/contas-metais/conta-metal.entity';
export { IContaMetalRepository } from './domain/contas-metais/repositories/iconta-metal.repository';
export { TipoMetal } from './domain/contas-metais/tipo-metal.enum';

// Explicitly re-export from _shared for direct access
export { UniqueEntityID } from './_shared/domain/unique-entity-id';