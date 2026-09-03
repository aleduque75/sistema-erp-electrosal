import { TipoMetal, PureMetalLotStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { LotNumberVO } from '../value-objects/lot-number.vo';
import { PureMetalLotStatusVO } from '../value-objects/pure-metal-lot-status.vo';
import { PurityVO } from '../value-objects/purity.vo';
import { MetalAmountVO } from '../value-objects/metal-amount.vo';

export interface PureMetalLotProps {
  id?: string;
  organizationId: string;
  sourceType: string;
  sourceId: string;
  metalType: TipoMetal;
  initialGrams: MetalAmountVO;
  remainingGrams: MetalAmountVO;
  purity: PurityVO;
  status: PureMetalLotStatusVO;
  entryDate: Date;
  notes?: string | null;
  lotNumber?: LotNumberVO | null;
  description?: string | null;
  saleId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PureMetalLotEntity {
  private props: PureMetalLotProps;

  private constructor(props: PureMetalLotProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    sourceType: string;
    sourceId: string;
    metalType: TipoMetal | string;
    initialGrams: number | string | Decimal | MetalAmountVO;
    remainingGrams?: number | string | Decimal | MetalAmountVO;
    purity?: number | string | Decimal | PurityVO;
    status?: string | PureMetalLotStatus | PureMetalLotStatusVO;
    entryDate?: Date | string;
    notes?: string | null;
    lotNumber?: string | number | LotNumberVO | null;
    description?: string | null;
    saleId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): PureMetalLotEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (!params.sourceType) {
      throw new Error('Tipo de origem (sourceType) é obrigatório.');
    }

    const initialGramsVO = params.initialGrams instanceof MetalAmountVO
      ? params.initialGrams
      : new MetalAmountVO(params.initialGrams);

    const remainingGramsVO = params.remainingGrams !== undefined && params.remainingGrams !== null
      ? (params.remainingGrams instanceof MetalAmountVO ? params.remainingGrams : new MetalAmountVO(params.remainingGrams, true))
      : new MetalAmountVO(initialGramsVO.value, true);

    const purityVO = params.purity != null
      ? (params.purity instanceof PurityVO ? params.purity : new PurityVO(params.purity))
      : new PurityVO(1.0);

    const lotNumberVO = params.lotNumber != null
      ? (params.lotNumber instanceof LotNumberVO ? params.lotNumber : new LotNumberVO(params.lotNumber))
      : null;

    const metalType = (params.metalType as TipoMetal) || TipoMetal.AU;

    const statusVO = params.status != null
      ? (params.status instanceof PureMetalLotStatusVO ? params.status : new PureMetalLotStatusVO(params.status))
      : PureMetalLotStatusVO.fromGrams(initialGramsVO.value, remainingGramsVO.value);

    const entryDate = params.entryDate
      ? (typeof params.entryDate === 'string' ? new Date(params.entryDate.includes('T') ? params.entryDate : `${params.entryDate}T12:00:00`) : params.entryDate)
      : new Date();

    return new PureMetalLotEntity({
      id: params.id,
      organizationId: params.organizationId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      metalType,
      initialGrams: initialGramsVO,
      remainingGrams: remainingGramsVO,
      purity: purityVO,
      status: statusVO,
      entryDate,
      notes: params.notes,
      lotNumber: lotNumberVO,
      description: params.description,
      saleId: params.saleId,
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

  get sourceType(): string {
    return this.props.sourceType;
  }

  get sourceId(): string {
    return this.props.sourceId;
  }

  get metalType(): TipoMetal {
    return this.props.metalType;
  }

  get initialGrams(): MetalAmountVO {
    return this.props.initialGrams;
  }

  get remainingGrams(): MetalAmountVO {
    return this.props.remainingGrams;
  }

  get purity(): PurityVO {
    return this.props.purity;
  }

  get status(): PureMetalLotStatusVO {
    return this.props.status;
  }

  get entryDate(): Date {
    return this.props.entryDate;
  }

  get notes(): string | null | undefined {
    return this.props.notes;
  }

  get lotNumber(): LotNumberVO | null | undefined {
    return this.props.lotNumber;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get saleId(): string | null | undefined {
    return this.props.saleId;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  canDeduct(amount: number | Decimal | MetalAmountVO): boolean {
    const dec = amount instanceof MetalAmountVO ? amount.decimal : (amount instanceof Decimal ? amount : new Decimal(amount));
    return this.props.remainingGrams.decimal.greaterThanOrEqualTo(dec);
  }

  deductGrams(amount: number | Decimal | MetalAmountVO): void {
    const dec = amount instanceof MetalAmountVO ? amount.decimal : (amount instanceof Decimal ? amount : new Decimal(amount));
    if (dec.lessThanOrEqualTo(0)) {
      throw new Error('A quantidade para dedução deve ser estritamente positiva.');
    }
    if (!this.canDeduct(dec)) {
      throw new Error(`Quantidade insuficiente no lote. Disponível: ${this.props.remainingGrams.value}g, Solicitado: ${dec.toNumber()}g.`);
    }

    const updatedRemaining = this.props.remainingGrams.minus(dec);
    this.props.remainingGrams = updatedRemaining;
    this.props.status = PureMetalLotStatusVO.fromGrams(this.props.initialGrams.value, updatedRemaining.value);
  }

  addGrams(amount: number | Decimal | MetalAmountVO): void {
    const dec = amount instanceof MetalAmountVO ? amount.decimal : (amount instanceof Decimal ? amount : new Decimal(amount));
    if (dec.lessThanOrEqualTo(0)) {
      throw new Error('A quantidade para adição deve ser estritamente positiva.');
    }

    const updatedRemaining = this.props.remainingGrams.plus(dec);
    this.props.remainingGrams = updatedRemaining;
    this.props.status = PureMetalLotStatusVO.fromGrams(this.props.initialGrams.value, updatedRemaining.value);
  }

  adjustGrams(newRemainingGrams: number | Decimal | MetalAmountVO): void {
    const dec = newRemainingGrams instanceof MetalAmountVO ? newRemainingGrams.decimal : (newRemainingGrams instanceof Decimal ? newRemainingGrams : new Decimal(newRemainingGrams));
    if (dec.isNegative()) {
      throw new Error('A quantidade restante ajustada não pode ser negativa.');
    }

    this.props.remainingGrams = new MetalAmountVO(dec, true);
    this.props.status = PureMetalLotStatusVO.fromGrams(this.props.initialGrams.value, this.props.remainingGrams.value);
  }

  linkSale(saleId: string): void {
    if (!saleId) {
      throw new Error('ID da venda é obrigatório para vínculo.');
    }
    this.props.saleId = saleId;
  }

  updateMetadata(data: {
    notes?: string | null;
    description?: string | null;
    entryDate?: Date | string | null;
    purity?: number | PurityVO | null;
  }): void {
    if (data.notes !== undefined) {
      this.props.notes = data.notes;
    }
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
    if (data.entryDate) {
      this.props.entryDate = typeof data.entryDate === 'string'
        ? new Date(data.entryDate.includes('T') ? data.entryDate : `${data.entryDate}T12:00:00`)
        : data.entryDate;
    }
    if (data.purity != null) {
      this.props.purity = data.purity instanceof PurityVO ? data.purity : new PurityVO(data.purity);
    }
  }

  calculatePureWeight(): Decimal {
    return this.props.purity.multiply(this.props.remainingGrams.decimal);
  }
}
