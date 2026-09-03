import Decimal from 'decimal.js';
import { AccountRecStatusVO } from '../value-objects/account-rec-status.vo';

export interface AccountRecProps {
  id?: string;
  organizationId: string;
  saleId?: string | null;
  description: string;
  amount: Decimal;
  dueDate: Date;
  status: AccountRecStatusVO;
  receivedAt?: Date | null;
  contaCorrenteId?: string | null;
  transacaoId_old?: string | null;
  externalId?: string | null;
  amountPaid: Decimal;
  goldAmount?: Decimal | null;
  goldAmountPaid?: Decimal | null;
  doNotUpdateSaleStatus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AccountRecEntity {
  private props: AccountRecProps;

  private constructor(props: AccountRecProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    saleId?: string | null;
    description: string;
    amount: number | string | Decimal;
    dueDate: Date | string;
    received?: boolean | string | AccountRecStatusVO;
    receivedAt?: Date | string | null;
    contaCorrenteId?: string | null;
    transacaoId_old?: string | null;
    externalId?: string | null;
    amountPaid?: number | string | Decimal | null;
    goldAmount?: number | string | Decimal | null;
    goldAmountPaid?: number | string | Decimal | null;
    doNotUpdateSaleStatus?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): AccountRecEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (!params.description || params.description.trim() === '') {
      throw new Error('A descrição da conta a receber é obrigatória.');
    }

    const amountDec = new Decimal(params.amount);
    if (amountDec.isNaN() || amountDec.lessThanOrEqualTo(0)) {
      throw new Error('O valor da conta a receber deve ser estritamente positivo.');
    }

    const amountPaidDec = params.amountPaid != null ? new Decimal(params.amountPaid) : new Decimal(0);
    const goldAmountPaidDec = params.goldAmountPaid != null ? new Decimal(params.goldAmountPaid) : new Decimal(0);

    const dueDate = params.dueDate
      ? (typeof params.dueDate === 'string' ? new Date(params.dueDate.includes('T') ? params.dueDate : `${params.dueDate}T12:00:00`) : params.dueDate)
      : new Date();

    const statusVO = params.received != null
      ? (params.received instanceof AccountRecStatusVO ? params.received : new AccountRecStatusVO(params.received))
      : new AccountRecStatusVO(false);

    const receivedAt = params.receivedAt
      ? (typeof params.receivedAt === 'string' ? new Date(params.receivedAt) : params.receivedAt)
      : null;

    return new AccountRecEntity({
      id: params.id,
      organizationId: params.organizationId,
      saleId: params.saleId,
      description: params.description.trim(),
      amount: amountDec.toDecimalPlaces(2),
      dueDate,
      status: statusVO,
      receivedAt,
      contaCorrenteId: params.contaCorrenteId,
      transacaoId_old: params.transacaoId_old,
      externalId: params.externalId,
      amountPaid: amountPaidDec.toDecimalPlaces(2),
      goldAmount: params.goldAmount != null ? new Decimal(params.goldAmount) : null,
      goldAmountPaid: goldAmountPaidDec.toDecimalPlaces(4),
      doNotUpdateSaleStatus: params.doNotUpdateSaleStatus ?? false,
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

  get saleId(): string | null | undefined {
    return this.props.saleId;
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

  get status(): AccountRecStatusVO {
    return this.props.status;
  }

  get received(): boolean {
    return this.props.status.isReceived;
  }

  get receivedAt(): Date | null | undefined {
    return this.props.receivedAt;
  }

  get contaCorrenteId(): string | null | undefined {
    return this.props.contaCorrenteId;
  }

  get transacaoId_old(): string | null | undefined {
    return this.props.transacaoId_old;
  }

  get externalId(): string | null | undefined {
    return this.props.externalId;
  }

  get amountPaid(): Decimal {
    return this.props.amountPaid;
  }

  get amountPaidNumber(): number {
    return this.props.amountPaid.toNumber();
  }

  get goldAmount(): Decimal | null | undefined {
    return this.props.goldAmount;
  }

  get goldAmountPaid(): Decimal | null | undefined {
    return this.props.goldAmountPaid;
  }

  get doNotUpdateSaleStatus(): boolean {
    return this.props.doNotUpdateSaleStatus;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  getRemainingAmount(): Decimal {
    return Decimal.max(0, this.props.amount.minus(this.props.amountPaid));
  }

  markAsReceived(receivedAt: Date = new Date()): void {
    this.props.status = new AccountRecStatusVO(true);
    this.props.receivedAt = receivedAt;
  }

  forceFinalize(): void {
    this.props.status = new AccountRecStatusVO(true);
    this.props.receivedAt = this.props.receivedAt || new Date();
  }

  updateDetails(params: {
    description?: string;
    amount?: number | string | Decimal;
    dueDate?: Date | string | null;
  }): void {
    if (this.props.status.isReceived) {
      throw new Error('Não é possível alterar uma conta a receber já liquidada.');
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
      if (params.dueDate === null) {
        this.props.dueDate = new Date();
      } else {
        this.props.dueDate = typeof params.dueDate === 'string'
          ? new Date(params.dueDate.includes('T') ? params.dueDate : `${params.dueDate}T12:00:00`)
          : params.dueDate;
      }
    }
  }
}
