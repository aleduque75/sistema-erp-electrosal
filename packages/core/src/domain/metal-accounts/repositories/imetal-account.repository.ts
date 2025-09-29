import { MetalAccount } from '../metal-account.entity';
import { TipoMetal } from '../../enums/tipo-metal.enum';

export interface IMetalAccountRepository {
  create(metalAccount: MetalAccount): Promise<void>;
  findById(id: string, organizationId: string): Promise<MetalAccount | null>;
  findAll(organizationId: string): Promise<MetalAccount[]>;
  findByPersonId(personId: string, metalType: TipoMetal, organizationId: string): Promise<MetalAccount | null>;
}