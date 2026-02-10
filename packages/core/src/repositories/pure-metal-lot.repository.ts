import { PureMetalLot } from '../domain/entities/pure-metal-lot.entity';

export interface IPureMetalLotRepository {
  create(lot: PureMetalLot): Promise<PureMetalLot>;
  findById(id: string, organizationId: string): Promise<PureMetalLot | null>;
  save(lot: PureMetalLot): Promise<PureMetalLot>;
  update(lot: PureMetalLot): Promise<PureMetalLot>;
}
