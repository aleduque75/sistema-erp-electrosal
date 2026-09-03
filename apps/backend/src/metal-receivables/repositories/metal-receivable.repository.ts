import { MetalReceivableEntity } from '../entities/metal-receivable.entity';

export abstract class MetalReceivablesRepository {
  abstract create(metalReceivable: MetalReceivableEntity, tx?: any): Promise<MetalReceivableEntity>;

  abstract findById(id: string, organizationId: string, tx?: any): Promise<MetalReceivableEntity | null>;

  abstract findBySaleId(saleId: string, organizationId: string, tx?: any): Promise<MetalReceivableEntity | null>;

  abstract findAll(params: {
    organizationId: string;
    pessoaId?: string;
    statuses?: string[];
  }, tx?: any): Promise<MetalReceivableEntity[]>;

  abstract update(metalReceivable: MetalReceivableEntity, tx?: any): Promise<MetalReceivableEntity>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
