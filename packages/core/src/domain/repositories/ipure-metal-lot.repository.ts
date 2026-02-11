import { PureMetalLot } from '../entities/pure-metal-lot.entity';

export interface IPureMetalLotRepository {
  create(pureMetalLot: PureMetalLot): Promise<PureMetalLot>;
  findById(id: string, organizationId: string): Promise<PureMetalLot | null>;
  save(pureMetalLot: PureMetalLot): Promise<PureMetalLot>;
}
