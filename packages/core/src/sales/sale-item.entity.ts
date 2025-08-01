import { randomUUID } from "crypto";

export type SaleItemProps = {
  id?: string;
  productId: string;
  quantity: number;
  price: number;
};

export class SaleItem {
  public readonly id: string;
  public props: Omit<SaleItemProps, "id">;

  private constructor(props: SaleItemProps) {
    this.id = props.id || randomUUID();
    this.props = props;
  }

  public static create(props: SaleItemProps): SaleItem {
    return new SaleItem(props);
  }

  get productId() {
    return this.props.productId;
  }
  get quantity() {
    return this.props.quantity;
  }
  get price() {
    return this.props.price;
  }
}
