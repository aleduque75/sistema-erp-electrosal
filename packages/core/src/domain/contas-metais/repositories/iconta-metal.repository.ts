import { ContaMetal } from '../conta-metal.entity';
import { TipoMetal } from '../tipo-metal.enum';

export interface IContaMetalRepository {
  findById(id: string, organizationId: string): Promise<ContaMetal | null>;
  findByNameAndMetalType(name: string, metalType: TipoMetal, organizationId: string): Promise<ContaMetal | null>;
  create(contaMetal: ContaMetal): Promise<ContaMetal>;
  save(contaMetal: ContaMetal): Promise<ContaMetal>;
}
