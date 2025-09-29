import { MetalAccountEntry } from '../metal-account-entry.entity';
import { ContaMetalType } from '../../enums/conta-metal-type.enum';
import { TipoMetal } from '../../enums/tipo-metal.enum';
import { ContaMetal } from '../conta-metal.entity';

// Removed: import { PrismaClient } from '@prisma/client'; // ADDED

export interface IContaMetalRepository {
  create(contaMetal: ContaMetal, tx?: any): Promise<ContaMetal>; // MODIFIED to use any

  findById(id: string, organizationId: string): Promise<ContaMetal | null>;
  findUnique(name: string, metalType: TipoMetal, type: ContaMetalType, organizationId: string): Promise<ContaMetal | null>;
  findByPessoaIdAndMetal( // ADDED
    pessoaId: string, // ADDED
    metalType: TipoMetal, // ADDED
    organizationId: string, // ADDED
    tx?: any, // MODIFIED to use any
  ): Promise<ContaMetal | null>; // ADDED
  updateBalance(
    id: string,
    organizationId: string,
    newBalance: number,
  ): Promise<void>;
  findAll(organizationId: string): Promise<ContaMetal[]>;
  save(contaMetal: ContaMetal, tx?: any): Promise<ContaMetal>; // MODIFIED to use any
}
