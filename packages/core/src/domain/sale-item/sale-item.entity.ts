import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface SaleItemProps {
  saleId: string;
  productId: string;
  quantity: number;
  price: number; // Decimal in Prisma, number in TS
  createdAt?: Date;
  updatedAt?: Date;
}

export class SaleItem extends Entity<SaleItemProps> {
  private constructor(props: SaleItemProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: SaleItemProps, id?: UniqueEntityID): SaleItem {
    const saleItem = new SaleItem(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return saleItem;
  }

  get saleId(): string {
    return this.props.saleId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get price(): number {
    return this.props.price;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<SaleItemProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
