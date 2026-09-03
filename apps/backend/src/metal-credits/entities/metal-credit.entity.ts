import { TipoMetal, MetalCreditStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { MetalCreditStatusVO } from '../value-objects/metal-credit-status.vo';

export interface MetalCreditProps {
  id?: string;
  organizationId: string;
  clientId: string;
  chemicalAnalysisId?: string | null;
  metalType: TipoMetal;
  grams: Decimal;
  settledGrams: Decimal;
  status: MetalCreditStatusVO;
  date: Date;
  pureMetalLotId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MetalCreditEntity {
  private props: MetalCreditProps;

  private constructor(props: MetalCreditProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    clientId: string;
    chemicalAnalysisId?: string | null;
    metalType: TipoMetal | string;
    grams: number | string | Decimal;
    settledGrams?: number | string | Decimal | null;
    status?: string | MetalCreditStatus | MetalCreditStatusVO;
    date?: Date | string;
    pureMetalLotId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): MetalCreditEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (!params.clientId) {
      throw new Error('ID do cliente é obrigatório.');
    }

    const gramsDec = new Decimal(params.grams);
    if (gramsDec.isNaN() || gramsDec.lessThanOrEqualTo(0)) {
      throw new Error('A quantidade de crédito em gramas deve ser estritamente positiva.');
    }

    const settledGramsDec = params.settledGrams != null ? new Decimal(params.settledGrams) : new Decimal(0);
    if (settledGramsDec.isNegative()) {
      throw new Error('A quantidade liquidada não pode ser negativa.');
    }

    const statusVO = params.status != null
      ? (params.status instanceof MetalCreditStatusVO ? params.status : new MetalCreditStatusVO(params.status))
      : MetalCreditStatusVO.fromGrams(gramsDec.toNumber(), settledGramsDec.toNumber());

    const date = params.date
      ? (typeof params.date === 'string' ? new Date(params.date.includes('T') ? params.date : `${params.date}T12:00:00`) : params.date)
      : new Date();

    return new MetalCreditEntity({
      id: params.id,
      organizationId: params.organizationId,
      clientId: params.clientId,
      chemicalAnalysisId: params.chemicalAnalysisId,
      metalType: (params.metalType as TipoMetal) || TipoMetal.AU,
      grams: gramsDec.toDecimalPlaces(4),
      settledGrams: settledGramsDec.toDecimalPlaces(4),
      status: statusVO,
      date,
      pureMetalLotId: params.pureMetalLotId,
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

  get clientId(): string {
    return this.props.clientId;
  }

  get chemicalAnalysisId(): string | null | undefined {
    return this.props.chemicalAnalysisId;
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

  get settledGrams(): Decimal {
    return this.props.settledGrams;
  }

  get settledGramsNumber(): number {
    return this.props.settledGrams.toNumber();
  }

  get status(): MetalCreditStatusVO {
    return this.props.status;
  }

  get date(): Date {
    return this.props.date;
  }

  get pureMetalLotId(): string | null | undefined {
    return this.props.pureMetalLotId;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  getRemainingGrams(): Decimal {
    return this.props.grams.minus(this.props.settledGrams);
  }

  canSettle(amount: number | Decimal): boolean {
    const dec = amount instanceof Decimal ? amount : new Decimal(amount);
    return this.getRemainingGrams().greaterThanOrEqualTo(dec);
  }

  settleGrams(amount: number | Decimal): void {
    const dec = amount instanceof Decimal ? amount : new Decimal(amount);
    if (dec.lessThanOrEqualTo(0)) {
      throw new Error('A quantidade para liquidação deve ser estritamente positiva.');
    }
    if (!this.canSettle(dec)) {
      throw new Error(`Saldo de crédito insuficiente para liquidação. Disponível: ${this.getRemainingGrams().toNumber()}g, Solicitado: ${dec.toNumber()}g.`);
    }

    this.props.settledGrams = this.props.settledGrams.plus(dec);
    this.props.status = MetalCreditStatusVO.fromGrams(
      this.props.grams.toNumber(),
      this.props.settledGrams.toNumber(),
    );
  }

  cancel(): void {
    if (this.props.status.isPaid()) {
      throw new Error('Não é possível cancelar um crédito já totalmente liquidado.');
    }
    this.props.status = new MetalCreditStatusVO(MetalCreditStatus.CANCELED);
  }

  updateDate(date: Date | string): void {
    this.props.date = typeof date === 'string'
      ? new Date(date.includes('T') ? date : `${date}T12:00:00`)
      : date;
  }
}
