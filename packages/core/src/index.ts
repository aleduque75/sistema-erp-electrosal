export * from './domain/product';
// This is a placeholder for shared types, interfaces, etc.
export interface SharedType {
  id: string;
  name: string;
}
export * from './_shared';

export * from './domain';
export * from './value-objects';
export * from './domain/entities/pure-metal-lot.entity';
export * from './domain/entities/chemical-reaction.entity';
export * from './domain/entities/inventory-lot.entity'; // Adicionado
export * from './domain/repositories/ipure-metal-lot.repository';
export * from './domain/repositories/ichemical-reaction.repository';
export * from './domain/repositories/iinventory-lot.repository'; // Adicionado
export * from './domain/repositories/iproduct.repository'; // Adicionado
export { ContaCorrenteType } from './domain/enums/conta-corrente-type.enum'; // Adicionado explicitamente
export { ContaMetalType } from './domain/enums/conta-metal-type.enum'; 
export { MetalAccountType } from './domain/enums/metal-account-type.enum';
export { TipoMetal } from './domain/enums/tipo-metal.enum';
export { StatusAnaliseQuimica } from './domain/enums/status-analise-quimica.enum';
export * from './domain/analises-quimicas/analise-quimica.entity';
export * from './domain/analises-quimicas/dtos/analise-quimica.response.dto';
export * from './domain/analises-quimicas/dtos/atualizar-analise.dto'
export * from './domain/analises-quimicas/dtos/criar-analise-quimica.dto';
export * from './domain/analises-quimicas/dtos/lancar-resultado-analise.dto';
export * from './domain/analises-quimicas/dtos/listar-analises.query.dto';
export * from './domain/recuperacoes/recuperacao.entity';
export * from './domain/analises-quimicas/dtos/registrar-nova-analise.dto';

// Explicitly re-export from _shared for direct access
export { UniqueEntityID } from './_shared/domain/unique-entity-id';