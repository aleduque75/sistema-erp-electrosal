import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface StockMovementProps {
  productId: string;
  type: string; // e.g., 'ENTRY', 'EXIT'
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date; // Not in schema, but good practice
}

export class StockMovement extends Entity<StockMovementProps> {
  private constructor(props: StockMovementProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: StockMovementProps, id?: UniqueEntityID): StockMovement {
    const stockMovement = new StockMovement(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return stockMovement;
  }

  get productId(): string {
    return this.props.productId;
  }

  get type(): string {
    return this.props.type;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<StockMovementProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
