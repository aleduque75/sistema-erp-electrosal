import { TipoMetal, ReceivableStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { MetalReceivableStatusVO } from '../value-objects/metal-receivable-status.vo';

export interface MetalReceivableProps {
  id?: string;
  organizationId: string;
  saleId: string;
  pessoaId: string;
  metalType: TipoMetal;
  grams: Decimal;
  remainingGrams: Decimal;
  status: MetalReceivableStatusVO;
  dueDate: Date;
  receivedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MetalReceivableEntity {
  private props: MetalReceivableProps;

  private constructor(props: MetalReceivableProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    saleId: string;
    pessoaId: string;
    metalType: TipoMetal | string;
    grams: number | string | Decimal;
    remainingGrams?: number | string | Decimal | null;
    status?: string | ReceivableStatus | MetalReceivableStatusVO;
    dueDate?: Date | string;
    receivedAt?: Date | string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): MetalReceivableEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (!params.saleId) {
      throw new Error('ID da venda é obrigatório.');
    }
    if (!params.pessoaId) {
      throw new Error('ID da pessoa (cliente) é obrigatório.');
    }

    const gramsDec = new Decimal(params.grams);
    if (gramsDec.isNaN() || gramsDec.lessThanOrEqualTo(0)) {
      throw new Error('A quantidade de gramas do recebível deve ser estritamente positiva.');
    }

    const remainingGramsDec = params.remainingGrams != null
      ? new Decimal(params.remainingGrams)
      : gramsDec;

    const statusVO = params.status != null
      ? (params.status instanceof MetalReceivableStatusVO ? params.status : new MetalReceivableStatusVO(params.status))
      : new MetalReceivableStatusVO(ReceivableStatus.PENDENTE);

    const dueDate = params.dueDate
      ? (typeof params.dueDate === 'string' ? new Date(params.dueDate.includes('T') ? params.dueDate : `${params.dueDate}T12:00:00`) : params.dueDate)
      : new Date();

    const receivedAt = params.receivedAt
      ? (typeof params.receivedAt === 'string' ? new Date(params.receivedAt) : params.receivedAt)
      : null;

    return new MetalReceivableEntity({
      id: params.id,
      organizationId: params.organizationId,
      saleId: params.saleId,
      pessoaId: params.pessoaId,
      metalType: (params.metalType as TipoMetal) || TipoMetal.AU,
      grams: gramsDec.toDecimalPlaces(4),
      remainingGrams: remainingGramsDec.toDecimalPlaces(4),
      status: statusVO,
      dueDate,
      receivedAt,
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

  get saleId(): string {
    return this.props.saleId;
  }

  get pessoaId(): string {
    return this.props.pessoaId;
  }

  get metalType(): TipoMetal {
    return this.props.metalType;
  }

  get grams(): Decimal {
    return this.props.grams;
  }

  get gramsNumber(): number {
    return this.props.grams.toNumber();
  }

  get remainingGrams(): Decimal {
    return this.props.remainingGrams;
  }

  get remainingGramsNumber(): number {
    return this.props.remainingGrams.toNumber();
  }

  get status(): MetalReceivableStatusVO {
    return this.props.status;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get receivedAt(): Date | null | undefined {
    return this.props.receivedAt;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  markAsPaid(date: Date = new Date()): void {
    this.props.remainingGrams = new Decimal(0);
    this.props.status = new MetalReceivableStatusVO(ReceivableStatus.PAGO);
    this.props.receivedAt = date;
  }

  cancel(): void {
    if (this.props.status.isPago()) {
      throw new Error('Não é possível cancelar um recebível de metal já pago.');
    }
    this.props.status = new MetalReceivableStatusVO(ReceivableStatus.CANCELADO);
  }
}
