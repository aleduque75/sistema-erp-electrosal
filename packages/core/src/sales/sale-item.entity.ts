import { Entity } from '../_shared/entity';

export interface SaleItemProps {
  productId: string;
  quantity: number;
  price: number; // Preço unitário no momento da venda
}

export class SaleItem extends Entity<SaleItemProps> {
  private constructor(props: SaleItemProps, id?: string) {
    super(props, id);
  }

  public static create(props: SaleItemProps): SaleItem {
    if (props.quantity <= 0) {
      throw new Error('A quantidade do item deve ser positiva.');
    }
    if (props.price < 0) {
      throw new Error('O preço do item não pode ser negativo.');
    }
    return new SaleItem(props);
  }

  get productId(): string { return this.props.productId; }
  get quantity(): number { return this.props.quantity; }
  get price(): number { return this.props.price; }
  get total(): number { return this.props.price * this.props.quantity; }
}