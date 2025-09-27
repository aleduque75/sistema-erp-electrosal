import { Entity } from '../../_shared/entity';

interface InventoryLotProps {
  organizationId: string;
  productId: string;
  costPrice: number;
  quantity: number;
  remainingQuantity: number;
  sourceType: string;
  sourceId: string;
  receivedDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InventoryLot extends Entity<InventoryLotProps> {
  private constructor(props: InventoryLotProps, id?: string) {
    super(props, id);
  }

  public static create(props: InventoryLotProps, id?: string): InventoryLot {
    const inventoryLot = new InventoryLot(
      {
        ...props,
        receivedDate: props.receivedDate ?? new Date(),
      },
      id,
    );
    return inventoryLot;
  }

  public static reconstitute(props: InventoryLotProps, id: string): InventoryLot {
    return new InventoryLot(props, id);
  }

  public decreaseRemainingQuantity(quantity: number): void {
    this.props.remainingQuantity -= quantity;
  }

  public update(props: Partial<InventoryLotProps>): void {
    Object.assign(this.props, props);
  }
}
