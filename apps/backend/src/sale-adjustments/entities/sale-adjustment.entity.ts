export interface SaleAdjustmentProps {
  id?: string;
  saleId: string;
  organizationId: string;
  paymentReceivedBRL: number;
  paymentQuotation?: number | null;
  paymentEquivalentGrams?: number | null;
  saleExpectedGrams?: number | null;
  grossDiscrepancyGrams?: number | null;
  costsInBRL?: number;
  costsInGrams?: number | null;
  netDiscrepancyGrams?: number | null;
  grossProfitBRL?: number | null;
  netProfitBRL?: number | null;
  otherCostsBRL?: number | null;
  totalCostBRL?: number | null;
  totalCostGrams?: number | null;
  laborCostBRL?: number | null;
  laborCostGrams?: number | null;
  commissionBRL?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SaleAdjustmentEntity {
  private readonly _id?: string;
  private readonly _saleId: string;
  private readonly _organizationId: string;
  private _paymentReceivedBRL: number;
  private _paymentQuotation?: number | null;
  private _paymentEquivalentGrams?: number | null;
  private _saleExpectedGrams?: number | null;
  private _grossDiscrepancyGrams?: number | null;
  private _costsInBRL: number;
  private _costsInGrams?: number | null;
  private _netDiscrepancyGrams?: number | null;
  private _grossProfitBRL?: number | null;
  private _netProfitBRL?: number | null;
  private _otherCostsBRL?: number | null;
  private _totalCostBRL?: number | null;
  private _totalCostGrams?: number | null;
  private _laborCostBRL?: number | null;
  private _laborCostGrams?: number | null;
  private _commissionBRL?: number | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: SaleAdjustmentProps) {
    if (!props.saleId?.trim()) {
      throw new Error('O ID da venda é obrigatório para o ajuste.');
    }
    if (!props.organizationId?.trim()) {
      throw new Error('A organização é obrigatória para o ajuste.');
    }

    this._id = props.id;
    this._saleId = props.saleId.trim();
    this._organizationId = props.organizationId.trim();
    this._paymentReceivedBRL = Number(props.paymentReceivedBRL || 0);
    this._paymentQuotation = props.paymentQuotation ? Number(props.paymentQuotation) : null;
    this._paymentEquivalentGrams = props.paymentEquivalentGrams ? Number(props.paymentEquivalentGrams) : null;
    this._saleExpectedGrams = props.saleExpectedGrams ? Number(props.saleExpectedGrams) : null;
    this._grossDiscrepancyGrams = props.grossDiscrepancyGrams ? Number(props.grossDiscrepancyGrams) : null;
    this._costsInBRL = Number(props.costsInBRL || 0);
    this._costsInGrams = props.costsInGrams ? Number(props.costsInGrams) : null;
    this._netDiscrepancyGrams = props.netDiscrepancyGrams ? Number(props.netDiscrepancyGrams) : null;
    this._grossProfitBRL = props.grossProfitBRL ? Number(props.grossProfitBRL) : null;
    this._netProfitBRL = props.netProfitBRL ? Number(props.netProfitBRL) : null;
    this._otherCostsBRL = props.otherCostsBRL ? Number(props.otherCostsBRL) : null;
    this._totalCostBRL = props.totalCostBRL ? Number(props.totalCostBRL) : null;
    this._totalCostGrams = props.totalCostGrams ? Number(props.totalCostGrams) : null;
    this._laborCostBRL = props.laborCostBRL ? Number(props.laborCostBRL) : null;
    this._laborCostGrams = props.laborCostGrams ? Number(props.laborCostGrams) : null;
    this._commissionBRL = props.commissionBRL ? Number(props.commissionBRL) : null;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.recalculateDiscrepancies();
  }

  static create(props: SaleAdjustmentProps): SaleAdjustmentEntity {
    return new SaleAdjustmentEntity(props);
  }

  get id(): string | undefined {
    return this._id;
  }
  get saleId(): string {
    return this._saleId;
  }
  get organizationId(): string {
    return this._organizationId;
  }
  get paymentReceivedBRL(): number {
    return this._paymentReceivedBRL;
  }
  get paymentQuotation(): number | null | undefined {
    return this._paymentQuotation;
  }
  get paymentEquivalentGrams(): number | null | undefined {
    return this._paymentEquivalentGrams;
  }
  get saleExpectedGrams(): number | null | undefined {
    return this._saleExpectedGrams;
  }
  get grossDiscrepancyGrams(): number | null | undefined {
    return this._grossDiscrepancyGrams;
  }
  get costsInBRL(): number {
    return this._costsInBRL;
  }
  get costsInGrams(): number | null | undefined {
    return this._costsInGrams;
  }
  get netDiscrepancyGrams(): number | null | undefined {
    return this._netDiscrepancyGrams;
  }
  get grossProfitBRL(): number | null | undefined {
    return this._grossProfitBRL;
  }
  get netProfitBRL(): number | null | undefined {
    return this._netProfitBRL;
  }
  get otherCostsBRL(): number | null | undefined {
    return this._otherCostsBRL;
  }
  get totalCostBRL(): number | null | undefined {
    return this._totalCostBRL;
  }
  get totalCostGrams(): number | null | undefined {
    return this._totalCostGrams;
  }
  get laborCostBRL(): number | null | undefined {
    return this._laborCostBRL;
  }
  get laborCostGrams(): number | null | undefined {
    return this._laborCostGrams;
  }
  get commissionBRL(): number | null | undefined {
    return this._commissionBRL;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  recalculateDiscrepancies(): void {
    if (this._paymentQuotation && this._paymentQuotation > 0 && this._paymentReceivedBRL > 0) {
      this._paymentEquivalentGrams = Number((this._paymentReceivedBRL / this._paymentQuotation).toFixed(4));
    }

    if (this._paymentEquivalentGrams !== null && this._paymentEquivalentGrams !== undefined && this._saleExpectedGrams !== null && this._saleExpectedGrams !== undefined) {
      this._grossDiscrepancyGrams = Number((this._paymentEquivalentGrams - this._saleExpectedGrams).toFixed(4));
      
      const costsGrams = this._costsInGrams || 0;
      this._netDiscrepancyGrams = Number((this._grossDiscrepancyGrams - costsGrams).toFixed(4));
    }

    this._updatedAt = new Date();
  }

  updateValues(props: Partial<SaleAdjustmentProps>): void {
    if (props.paymentReceivedBRL !== undefined) {
      this._paymentReceivedBRL = Number(props.paymentReceivedBRL);
    }
    if (props.paymentQuotation !== undefined) {
      this._paymentQuotation = props.paymentQuotation ? Number(props.paymentQuotation) : null;
    }
    if (props.saleExpectedGrams !== undefined) {
      this._saleExpectedGrams = props.saleExpectedGrams ? Number(props.saleExpectedGrams) : null;
    }
    if (props.costsInBRL !== undefined) {
      this._costsInBRL = Number(props.costsInBRL);
    }
    if (props.costsInGrams !== undefined) {
      this._costsInGrams = props.costsInGrams ? Number(props.costsInGrams) : null;
    }
    if (props.grossProfitBRL !== undefined) {
      this._grossProfitBRL = props.grossProfitBRL ? Number(props.grossProfitBRL) : null;
    }
    if (props.netProfitBRL !== undefined) {
      this._netProfitBRL = props.netProfitBRL ? Number(props.netProfitBRL) : null;
    }
    if (props.otherCostsBRL !== undefined) {
      this._otherCostsBRL = props.otherCostsBRL ? Number(props.otherCostsBRL) : null;
    }

    this.recalculateDiscrepancies();
  }
}
