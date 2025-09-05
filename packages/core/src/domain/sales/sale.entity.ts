import { randomUUID } from "crypto";
import { SaleItem } from "./sale-item.entity";
import { SaleInstallment } from "./sale-installment.entity";

export type SaleProps = {
  id?: string;
  userId: string;
  clientId: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod?: string;
  items: SaleItem[];
  installments: SaleInstallment[];
  createdAt?: Date;
  // ✅ Propriedades que faltavam:
  netAmount?: number;
  feeAmount?: number;
  contaContabilId?: string;
  contaCorrenteId?: string;
};

export class Sale {
  public readonly id: string;
  public props: Omit<SaleProps, "id">;

  private constructor(props: SaleProps) {
    this.id = props.id || randomUUID();
    this.props = {
      ...props,
      createdAt: props.createdAt || new Date(),
    };
  }

  public static create(props: SaleProps) {
    // Adicionar aqui a lógica de cálculo se necessário
    if (props.totalAmount && props.feeAmount) {
      props.netAmount = props.totalAmount - props.feeAmount;
    }
    return new Sale(props);
  }

  // Getters para todas as propriedades
  get userId() {
    return this.props.userId;
  }
  get clientId() {
    return this.props.clientId;
  }
  get orderNumber() {
    return this.props.orderNumber;
  }
  get totalAmount() {
    return this.props.totalAmount;
  }
  get paymentMethod() {
    return this.props.paymentMethod;
  }
  get items() {
    return this.props.items;
  }
  get installments() {
    return this.props.installments;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  // ✅ Getters para as novas propriedades
  get netAmount() {
    return this.props.netAmount;
  }
  get feeAmount() {
    return this.props.feeAmount;
  }
  get contaContabilId() {
    return this.props.contaContabilId;
  }
  get contaCorrenteId() {
    return this.props.contaCorrenteId;
  }
}
