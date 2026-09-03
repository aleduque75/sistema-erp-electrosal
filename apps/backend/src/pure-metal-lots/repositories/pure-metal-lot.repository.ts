import { TipoMetal } from '@prisma/client';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';

export interface LotWithRelationsDomain {
  lot: PureMetalLotEntity;
  sale?: any;
  chemicalReactions?: any[];
}

export abstract class PureMetalLotsRepository {
  abstract create(lot: PureMetalLotEntity, tx?: any): Promise<PureMetalLotEntity>;

  abstract findById(id: string, organizationId: string, tx?: any): Promise<LotWithRelationsDomain | null>;

  abstract findAll(
    organizationId: string,
    filters?: { metalType?: TipoMetal; remainingGramsGt?: number },
    tx?: any,
  ): Promise<LotWithRelationsDomain[]>;

  abstract update(lot: PureMetalLotEntity, tx?: any): Promise<PureMetalLotEntity>;

  abstract remove(id: string, organizationId: string, tx?: any): Promise<void>;

  abstract findRecoveryOrderOrigin(
    sourceId: string,
    organizationId: string,
    tx?: any,
  ): Promise<{ orderNumber?: string; observacoes?: string | null } | null>;

  abstract findMetalCreditOrigin(
    sourceId: string,
    organizationId: string,
    tx?: any,
  ): Promise<{ clientName?: string } | null>;

  abstract findManyMovementsByPureMetalLotId(
    pureMetalLotId: string,
    organizationId: string,
    tx?: any,
  ): Promise<any[]>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
