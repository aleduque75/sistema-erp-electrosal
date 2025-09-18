import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface InventoryLotProps {
  id: UniqueEntityID;
  remainingQuantity: number;
  sourceType: string;
}

export interface ProductProps {
  organizationId: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number | null;
  stock: number;
  inventoryLots?: InventoryLotProps[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: ProductProps, id?: UniqueEntityID): Product {
    const product = new Product(
      {
        ...props,
        inventoryLots: props.inventoryLots ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return product;
  }

  get id(): UniqueEntityID {
    return this._id;
  }

  get inventoryLots(): InventoryLotProps[] {
    return this.props.inventoryLots!;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get costPrice(): number | null | undefined {
    return this.props.costPrice;
  }

  get stock(): number {
    return this.props.stock;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<ProductProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id.toString(),
      name: this.name,
      description: this.description,
      price: this.price,
      costPrice: this.costPrice,
      stock: this.stock,
      inventoryLots: this.inventoryLots.map(lot => ({
        id: lot.id.toString(),
        remainingQuantity: lot.remainingQuantity,
        sourceType: lot.sourceType,
      })),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      organizationId: this.organizationId,
    }
  }
}
