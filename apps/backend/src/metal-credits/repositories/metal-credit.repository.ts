import { MetalCreditEntity } from '../entities/metal-credit.entity';

export abstract class MetalCreditsRepository {
  abstract create(metalCredit: MetalCreditEntity, tx?: any): Promise<MetalCreditEntity>;

  abstract findById(id: string, organizationId: string, tx?: any): Promise<MetalCreditEntity | null>;

  abstract findByClientId(clientId: string, organizationId: string, tx?: any): Promise<MetalCreditEntity[]>;

  abstract findAll(organizationId: string, tx?: any): Promise<MetalCreditEntity[]>;

  abstract update(metalCredit: MetalCreditEntity, tx?: any): Promise<MetalCreditEntity>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
