import { PureMetalLot } from '../entities/pure-metal-lot.entity';

export interface IPureMetalLotRepository {
  create(lot: PureMetalLot): Promise<PureMetalLot>;
  findById(id: string): Promise<PureMetalLot | null>;
  update(lot: PureMetalLot): Promise<PureMetalLot>;
}
