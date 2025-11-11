import { InventoryLot } from '../domain/entities/inventory-lot.entity';

export interface IInventoryLotRepository {
  create(inventoryLot: InventoryLot): Promise<InventoryLot>;
  findById(id: string, organizationId: string): Promise<InventoryLot | null>;
  save(inventoryLot: InventoryLot): Promise<InventoryLot>;
}
