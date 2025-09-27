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

  public decreaseRemainingGrams(grams: number): void {
    this.props.remainingGrams -= grams;
  }

  public update(props: Partial<PureMetalLotProps>): void {
    Object.assign(this.props, props);
  }
}
