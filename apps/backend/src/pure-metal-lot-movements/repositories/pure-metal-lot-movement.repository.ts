import { PureMetalLotMovementEntity } from '../entities/pure-metal-lot-movement.entity';

export abstract class PureMetalLotMovementsRepository {
  abstract create(movement: PureMetalLotMovementEntity, tx?: any): Promise<PureMetalLotMovementEntity>;

  abstract findById(id: string, organizationId: string, tx?: any): Promise<PureMetalLotMovementEntity | null>;

  abstract findAll(
    organizationId: string,
    pureMetalLotId?: string,
    tx?: any,
  ): Promise<PureMetalLotMovementEntity[]>;

  abstract update(movement: PureMetalLotMovementEntity, tx?: any): Promise<PureMetalLotMovementEntity>;

  abstract remove(id: string, organizationId: string, tx?: any): Promise<void>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
