import Decimal from 'decimal.js';

export interface RawMaterialItemProps {
  id?: string;
  organizationId: string;
  rawMaterialId: string;
  quantity: number;
  cost: Decimal;
  goldEquivalentCost?: Decimal | null;
  recoveryOrderId?: string | null;
  rawMaterialName?: string;
}

export class RawMaterialItemEntity {
  private props: RawMaterialItemProps;

  private constructor(props: RawMaterialItemProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    rawMaterialId: string;
    quantity: number;
    cost: number | string | Decimal;
    goldEquivalentCost?: number | string | Decimal | null;
    recoveryOrderId?: string | null;
    rawMaterialName?: string;
  }): RawMaterialItemEntity {
    if (!params.rawMaterialId) {
      throw new Error('ID da matéria-prima é obrigatório.');
    }
    if (params.quantity <= 0) {
      throw new Error('A quantidade de matéria-prima deve ser estritamente positiva.');
    }

    const costDec = new Decimal(params.cost ?? 0);
    if (costDec.isNegative()) {
      throw new Error('O custo da matéria-prima não pode ser negativo.');
    }

    const goldCostDec = params.goldEquivalentCost != null ? new Decimal(params.goldEquivalentCost) : null;

    return new RawMaterialItemEntity({
      id: params.id,
      organizationId: params.organizationId,
      rawMaterialId: params.rawMaterialId,
      quantity: params.quantity,
      cost: costDec,
      goldEquivalentCost: goldCostDec,
      recoveryOrderId: params.recoveryOrderId,
      rawMaterialName: params.rawMaterialName,
    });
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get rawMaterialId(): string {
    return this.props.rawMaterialId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get cost(): Decimal {
    return this.props.cost;
  }

  get goldEquivalentCost(): Decimal | null | undefined {
    return this.props.goldEquivalentCost;
  }

  get recoveryOrderId(): string | null | undefined {
    return this.props.recoveryOrderId;
  }

  get rawMaterialName(): string | undefined {
    return this.props.rawMaterialName;
  }
}
