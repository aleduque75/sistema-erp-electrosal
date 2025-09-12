import { Entity } from "../../_shared/entity";
import { SaleInstallmentStatus } from "./enums/sale-installment-status.enum"; // 👈 Importe o Enum

export interface SaleInstallmentProps {
  saleId: string;
  amount: number;
  dueDate: Date;
  status: SaleInstallmentStatus; // 👈 Adicione a propriedade aqui
  installmentNumber: number;
  paidAt?: Date | null;
}

export class SaleInstallment extends Entity<SaleInstallmentProps> {
  private constructor(props: SaleInstallmentProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: SaleInstallmentProps,
    id?: string
  ): SaleInstallment {
    // Aqui você pode adicionar validações, se necessário
    return new SaleInstallment(props, id);
  }

  // Getters para acessar as propriedades de forma segura
  get saleId(): string {
    return this.props.saleId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get status(): SaleInstallmentStatus {
    // 👈 Getter para o status
    return this.props.status;
  }

  get paidAt(): Date | null | undefined {
    return this.props.paidAt;
  }

  // Métodos de negócio para mudar o estado
  public pay(): void {
    if (this.props.status === SaleInstallmentStatus.PAID) {
      throw new Error("Installment is already paid.");
    }
    this.props.status = SaleInstallmentStatus.PAID;
    this.props.paidAt = new Date();
  }
}
