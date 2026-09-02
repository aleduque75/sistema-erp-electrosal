import { MetalAmountVO } from '../value-objects/metal-amount.vo';
import { MetalTypeVO } from '../value-objects/metal-type.vo';
import Decimal from 'decimal.js';

export interface MetalPaymentProps {
  id?: string;
  organizationId: string;
  userId: string;
  clientId: string;
  pureMetalLotId: string;
  metalCreditId?: string;
  grams: MetalAmountVO;
  metalType: MetalTypeVO;
  notes?: string;
  data: Date;
  quotationPrice: number;
}

export class MetalPaymentEntity {
  private props: MetalPaymentProps;

  private constructor(props: MetalPaymentProps) {
    this.props = props;
  }

  public static create(params: {
    id?: string;
    organizationId: string;
    userId: string;
    clientId: string;
    pureMetalLotId: string;
    metalCreditId?: string;
    grams: number | string | Decimal | MetalAmountVO;
    metalType: string | MetalTypeVO;
    notes?: string;
    data?: Date | string;
    quotationPrice: number;
  }): MetalPaymentEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (!params.clientId) {
      throw new Error('ID do cliente é obrigatório.');
    }
    if (!params.pureMetalLotId) {
      throw new Error('ID do lote de metal puro é obrigatório.');
    }
    if (!params.quotationPrice || params.quotationPrice <= 0) {
      throw new Error('A cotação do metal deve ser estritamente positiva.');
    }

    const gramsVO = params.grams instanceof MetalAmountVO
      ? params.grams
      : new MetalAmountVO(params.grams);

    const metalTypeVO = params.metalType instanceof MetalTypeVO
      ? params.metalType
      : new MetalTypeVO(params.metalType);

    const paymentDate = params.data ? new Date(params.data) : new Date();

    return new MetalPaymentEntity({
      id: params.id,
      organizationId: params.organizationId,
      userId: params.userId,
      clientId: params.clientId,
      pureMetalLotId: params.pureMetalLotId,
      metalCreditId: params.metalCreditId,
      grams: gramsVO,
      metalType: metalTypeVO,
      notes: params.notes,
      data: paymentDate,
      quotationPrice: params.quotationPrice,
    });
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get pureMetalLotId(): string {
    return this.props.pureMetalLotId;
  }

  get metalCreditId(): string | undefined {
    return this.props.metalCreditId;
  }

  get grams(): MetalAmountVO {
    return this.props.grams;
  }

  get metalType(): MetalTypeVO {
    return this.props.metalType;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get data(): Date {
    return this.props.data;
  }

  get quotationPrice(): number {
    return this.props.quotationPrice;
  }

  calculateBRLValue(): Decimal {
    return this.props.grams.multiply(this.props.quotationPrice);
  }

  getStockDeductionGrams(): number {
    return this.props.grams.toNegative().toNumber();
  }

  hasEnoughLotBalance(lotRemainingGrams: number): boolean {
    return new Decimal(lotRemainingGrams).greaterThanOrEqualTo(this.props.grams.decimal);
  }
}
