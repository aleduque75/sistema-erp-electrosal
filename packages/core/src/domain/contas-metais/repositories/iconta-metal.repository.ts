import { ContaMetal } from '../conta-metal.entity';
import { MetalAccountEntry } from '../metal-account-entry.entity';
import { TipoMetal } from '../tipo-metal.enum'; // Corrected import

// Removed: import { PrismaClient } from '@prisma/client'; // ADDED

export interface IContaMetalRepository {
  create(contaMetal: ContaMetal, tx?: any): Promise<ContaMetal>; // MODIFIED to use any
  createEntry(organizationId: string, entry: Partial<MetalAccountEntry>): Promise<MetalAccountEntry>;
  findById(id: string, organizationId: string): Promise<ContaMetal | null>;
  findByNameAndMetalType(
    name: string,
    metalType: TipoMetal,
    organizationId: string,
  ): Promise<ContaMetal | null>;
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
