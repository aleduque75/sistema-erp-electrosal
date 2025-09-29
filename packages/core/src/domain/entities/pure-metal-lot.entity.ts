import { Entity } from '../../_shared/entity';
import { PureMetalLotStatus, TipoMetal } from '../enums';

interface PureMetalLotProps {
  organizationId: string;
  sourceType: string;
  sourceId: string;
  metalType: TipoMetal;
  initialGrams: number;
  remainingGrams: number;
  purity: number;
  status: PureMetalLotStatus;
  entryDate: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PureMetalLot extends Entity<PureMetalLotProps> {
  private constructor(props: PureMetalLotProps, id?: string) {
    super(props, id);
  }

  public static create(props: PureMetalLotProps, id?: string): PureMetalLot {
    const pureMetalLot = new PureMetalLot(
      {
        ...props,
        status: props.status ?? PureMetalLotStatus.AVAILABLE,
        entryDate: props.entryDate ?? new Date(),
      },
      id,
    );
    return pureMetalLot;
  }

  public static reconstitute(props: PureMetalLotProps, id: string): PureMetalLot {
    return new PureMetalLot(props, id);
  }

  get organizationId(): string { return this.props.organizationId; }
  get sourceType(): string { return this.props.sourceType; }
  get sourceId(): string { return this.props.sourceId; }
  get metalType(): TipoMetal { return this.props.metalType; }
  get initialGrams(): number { return this.props.initialGrams; }
  get remainingGrams(): number { return this.props.remainingGrams; }
  get purity(): number { return this.props.purity; }
  get status(): PureMetalLotStatus { return this.props.status; }
  get entryDate(): Date { return this.props.entryDate; }
  get notes(): string | undefined { return this.props.notes; }

  public decreaseRemainingGrams(grams: number): void {
    this.props.remainingGrams -= grams;
  }

  public update(props: Partial<PureMetalLotProps>): void {
    Object.assign(this.props, props);
  }
}
