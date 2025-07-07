import { Entity } from "../_shared/entity";
import { nanoid } from "nanoid";
import { SaleItem } from "./sale-item.entity"; // Importa a entidade SaleItem

export interface SaleProps {
  userId: string;
  clientId: string;
  items: SaleItem[];
  paymentMethod: string;
  contaContabilId: string;
  contaCorrenteId?: string | null;
}

export class Sale extends Entity<SaleProps> {
  public readonly orderNumber: string;
  public readonly totalAmount: number;
  public feeAmount?: number;
  public netAmount?: number;

  private constructor(props: SaleProps, id?: string) {
    super(props, id);
    this.orderNumber = nanoid(8);
    this.totalAmount = this.props.items.reduce(
      (acc, item) => acc + item.total,
      0
    );
    this.processPayment();
  }

  public static create(props: SaleProps): Sale {
    if (props.items.length === 0) {
      throw new Error("A venda deve ter pelo menos um item.");
    }
    return new Sale(props);
  }

  private processPayment(): void {
    if (this.props.paymentMethod === "Credit Card") {
      const TAX_RATE = 0.04;
      this.feeAmount = this.totalAmount * TAX_RATE;
      this.netAmount = this.totalAmount - this.feeAmount;
    } else {
      this.feeAmount = 0;
      this.netAmount = this.totalAmount;
    }
  }

  // Getters
  get items(): SaleItem[] {
    return this.props.items;
  }
  get clientId(): string {
    return this.props.clientId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get paymentMethod(): string {
    return this.props.paymentMethod;
  }
  get contaContabilId(): string {
    return this.props.contaContabilId;
  }
  get contaCorrenteId(): string | null | undefined {
    return this.props.contaCorrenteId;
  }
}
