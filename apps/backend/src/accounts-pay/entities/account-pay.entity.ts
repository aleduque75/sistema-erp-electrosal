import Decimal from 'decimal.js';
import { addMonths } from 'date-fns';
import { AccountPayStatusVO } from '../value-objects/account-pay-status.vo';

export interface AccountPayProps {
  id?: string;
  organizationId: string;
  description: string;
  amount: Decimal;
  dueDate: Date;
  status: AccountPayStatusVO;
  paidAt?: Date | null;
  installmentNumber?: number | null;
  isInstallment?: boolean | null;
  totalInstallments?: number | null;
  contaContabilId?: string | null;
  fornecedorId?: string | null;
  purchaseOrderId?: string | null;
  originalAccountId?: string | null;
  transacaoId?: string | null;
  goldAmount?: Decimal | null;
  goldPrice?: Decimal | null;
  recoveryReportPeriod?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AccountPayEntity {
  private props: AccountPayProps;

  private constructor(props: AccountPayProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    description: string;
    amount: number | string | Decimal;
    dueDate: Date | string;
    paid?: boolean | string | AccountPayStatusVO;
    paidAt?: Date | string | null;
    installmentNumber?: number | null;
    isInstallment?: boolean | null;
    totalInstallments?: number | null;
    contaContabilId?: string | null;
    fornecedorId?: string | null;
    purchaseOrderId?: string | null;
    originalAccountId?: string | null;
    transacaoId?: string | null;
    goldAmount?: number | string | Decimal | null;
    goldPrice?: number | string | Decimal | null;
    recoveryReportPeriod?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): AccountPayEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (!params.description || params.description.trim() === '') {
      throw new Error('A descrição da conta a pagar é obrigatória.');
    }

    const amountDec = new Decimal(params.amount);
    if (amountDec.isNaN() || amountDec.lessThanOrEqualTo(0)) {
      throw new Error('O valor da conta a pagar deve ser estritamente positivo.');
    }

    const dueDate = params.dueDate
      ? (typeof params.dueDate === 'string' ? new Date(params.dueDate.includes('T') ? params.dueDate : `${params.dueDate}T12:00:00`) : params.dueDate)
      : new Date();

    const statusVO = params.paid != null
      ? (params.paid instanceof AccountPayStatusVO ? params.paid : new AccountPayStatusVO(params.paid))
      : new AccountPayStatusVO(false);

    const paidAt = params.paidAt
      ? (typeof params.paidAt === 'string' ? new Date(params.paidAt) : params.paidAt)
      : null;

    return new AccountPayEntity({
      id: params.id,
      organizationId: params.organizationId,
      description: params.description.trim(),
      amount: amountDec.toDecimalPlaces(2),
      dueDate,
      status: statusVO,
      paidAt,
      installmentNumber: params.installmentNumber,
      isInstallment: params.isInstallment,
      totalInstallments: params.totalInstallments,
      contaContabilId: params.contaContabilId,
      fornecedorId: params.fornecedorId,
      purchaseOrderId: params.purchaseOrderId,
      originalAccountId: params.originalAccountId,
      transacaoId: params.transacaoId,
      goldAmount: params.goldAmount != null ? new Decimal(params.goldAmount) : null,
      goldPrice: params.goldPrice != null ? new Decimal(params.goldPrice) : null,
      recoveryReportPeriod: params.recoveryReportPeriod,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get description(): string {
    return this.props.description;
  }

  get amount(): Decimal {
    return this.props.amount;
  }

  get amountNumber(): number {
    return this.props.amount.toNumber();
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get status(): AccountPayStatusVO {
    return this.props.status;
  }

  get paid(): boolean {
    return this.props.status.isPaid;
  }

  get paidAt(): Date | null | undefined {
    return this.props.paidAt;
  }

  get installmentNumber(): number | null | undefined {
    return this.props.installmentNumber;
  }

  get isInstallment(): boolean | null | undefined {
    return this.props.isInstallment;
  }

  get totalInstallments(): number | null | undefined {
    return this.props.totalInstallments;
  }

  get contaContabilId(): string | null | undefined {
    return this.props.contaContabilId;
  }

  get fornecedorId(): string | null | undefined {
    return this.props.fornecedorId;
  }

  get purchaseOrderId(): string | null | undefined {
    return this.props.purchaseOrderId;
  }

  get originalAccountId(): string | null | undefined {
    return this.props.originalAccountId;
  }

  get transacaoId(): string | null | undefined {
    return this.props.transacaoId;
  }

  get goldAmount(): Decimal | null | undefined {
    return this.props.goldAmount;
  }

  get goldPrice(): Decimal | null | undefined {
    return this.props.goldPrice;
  }

  get recoveryReportPeriod(): string | null | undefined {
    return this.props.recoveryReportPeriod;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  markAsPaid(paidAt: Date = new Date(), transacaoId?: string): void {
    if (this.props.status.isPaid) {
      throw new Error('Esta conta a pagar já está marcada como paga.');
    }
    this.props.status = new AccountPayStatusVO(true);
    this.props.paidAt = paidAt;
    if (transacaoId) {
      this.props.transacaoId = transacaoId;
    }
  }

  updateDetails(params: {
    description?: string;
    amount?: number | string | Decimal;
    dueDate?: Date | string;
    contaContabilId?: string | null;
    fornecedorId?: string | null;
  }): void {
    if (this.props.status.isPaid) {
      throw new Error('Não é possível editar uma conta a pagar que já foi liquidada.');
    }
    if (params.description !== undefined) {
      this.props.description = params.description.trim();
    }
    if (params.amount !== undefined) {
      const dec = new Decimal(params.amount);
      if (dec.lessThanOrEqualTo(0)) throw new Error('O valor deve ser positivo.');
      this.props.amount = dec.toDecimalPlaces(2);
    }
    if (params.dueDate !== undefined) {
      this.props.dueDate = typeof params.dueDate === 'string'
        ? new Date(params.dueDate.includes('T') ? params.dueDate : `${params.dueDate}T12:00:00`)
        : params.dueDate;
    }
    if (params.contaContabilId !== undefined) {
      this.props.contaContabilId = params.contaContabilId;
    }
    if (params.fornecedorId !== undefined) {
      this.props.fornecedorId = params.fornecedorId;
    }
  }

  split(numberOfInstallments: number): AccountPayEntity[] {
    if (this.props.status.isPaid) {
      throw new Error('Não é possível parcelar uma conta já paga.');
    }
    if (numberOfInstallments < 2) {
      throw new Error('O número de parcelas deve ser no mínimo 2.');
    }

    const totalDec = this.props.amount;
    const baseInstallmentAmount = totalDec.dividedBy(numberOfInstallments).toDecimalPlaces(2, Decimal.ROUND_DOWN);
    let remainder = totalDec.minus(baseInstallmentAmount.times(numberOfInstallments));

    const installments: AccountPayEntity[] = [];

    for (let i = 1; i <= numberOfInstallments; i++) {
      let installmentAmount = baseInstallmentAmount;
      if (remainder.greaterThan(0)) {
        installmentAmount = installmentAmount.plus(0.01);
        remainder = remainder.minus(0.01);
      }

      const installmentDueDate = addMonths(this.props.dueDate, i - 1);

      installments.push(
        AccountPayEntity.create({
          organizationId: this.props.organizationId,
          description: `${this.props.description} (${i}/${numberOfInstallments})`,
          amount: installmentAmount,
          dueDate: installmentDueDate,
          paid: false,
          isInstallment: true,
          installmentNumber: i,
          totalInstallments: numberOfInstallments,
          contaContabilId: this.props.contaContabilId,
          fornecedorId: this.props.fornecedorId,
          purchaseOrderId: this.props.purchaseOrderId,
          originalAccountId: this.props.id,
        }),
      );
    }

    return installments;
  }
}
