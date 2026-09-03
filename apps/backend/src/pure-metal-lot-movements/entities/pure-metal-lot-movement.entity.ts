import { PureMetalLotMovementType } from '@prisma/client';
import Decimal from 'decimal.js';
import { PureMetalLotMovementTypeVO } from '../value-objects/movement-type.vo';

export interface PureMetalLotMovementProps {
  id?: string;
  organizationId: string;
  pureMetalLotId: string;
  type: PureMetalLotMovementTypeVO;
  grams: Decimal;
  date: Date;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PureMetalLotMovementEntity {
  private props: PureMetalLotMovementProps;

  private constructor(props: PureMetalLotMovementProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    pureMetalLotId: string;
    type: string | PureMetalLotMovementType | PureMetalLotMovementTypeVO;
    grams: number | string | Decimal;
    date?: Date | string;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): PureMetalLotMovementEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (!params.pureMetalLotId) {
      throw new Error('ID do lote de metal puro é obrigatório.');
    }

    const typeVO = params.type instanceof PureMetalLotMovementTypeVO
      ? params.type
      : new PureMetalLotMovementTypeVO(params.type);

    const decGrams = new Decimal(params.grams);
    if (decGrams.isNaN() || !decGrams.isFinite()) {
      throw new Error('Quantidade de metal inválida para movimentação.');
    }

    if (typeVO.isEntry() || typeVO.isExit()) {
      if (decGrams.lessThanOrEqualTo(0)) {
        throw new Error('A quantidade de gramas para entrada ou saída deve ser estritamente positiva.');
      }
    }

    const date = params.date
      ? (typeof params.date === 'string' ? new Date(params.date.includes('T') ? params.date : `${params.date}T12:00:00`) : params.date)
      : new Date();

    return new PureMetalLotMovementEntity({
      id: params.id,
      organizationId: params.organizationId,
      pureMetalLotId: params.pureMetalLotId,
      type: typeVO,
      grams: decGrams.toDecimalPlaces(4),
      date,
      notes: params.notes,
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

  get pureMetalLotId(): string {
    return this.props.pureMetalLotId;
  }

  get type(): PureMetalLotMovementTypeVO {
    return this.props.type;
  }

  get grams(): Decimal {
    return this.props.grams;
  }

  get gramsNumber(): number {
    return this.props.grams.toNumber();
  }

  get date(): Date {
    return this.props.date;
  }

  get notes(): string | null | undefined {
    return this.props.notes;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  getSignedDeltaGrams(): number {
    if (this.props.type.isEntry()) {
      return this.props.grams.toNumber();
    }
    if (this.props.type.isExit()) {
      return this.props.grams.negated().toNumber();
    }
    // ADJUSTMENT
    return this.props.grams.toNumber();
  }
}
