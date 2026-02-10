import { MetalAccount } from '../metal-account.entity';
import { MetalAccountEntry } from '../metal-account-entry.entity';
import { TipoMetal } from '../../enums/tipo-metal.enum';

export interface IMetalAccountRepository {
  create(metalAccount: MetalAccount, tx?: any): Promise<void>;
  findById(id: string, organizationId: string, tx?: any): Promise<MetalAccount | null>;
  findAll(organizationId: string, tx?: any): Promise<any[]>;
  findByPersonId(personId: string, metalType: TipoMetal, organizationId: string, tx?: any): Promise<MetalAccount | null>;
  addEntry(metalAccount: MetalAccount, entry: MetalAccountEntry, tx?: any): Promise<void>;
}