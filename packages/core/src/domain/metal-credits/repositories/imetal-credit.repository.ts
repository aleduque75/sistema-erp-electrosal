import { MetalCredit } from '../entities/metal-credit.entity';
import { UniqueEntityID } from '../../../_shared/domain/unique-entity-id';



export interface IMetalCreditRepository {
  create(metalCredit: MetalCredit): Promise<MetalCredit>;
  findById(id: UniqueEntityID): Promise<MetalCredit | null>;
  updateGrams(id: UniqueEntityID, newGrams: number, tx?: any): Promise<MetalCredit>;
  update(id: string, data: Partial<MetalCredit>, organizationId: string): Promise<MetalCredit>;
  findByClientId(clientId: string, organizationId: string): Promise<MetalCredit[]>;
  findAll(organizationId: string): Promise<MetalCredit[]>;
}
