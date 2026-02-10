import { UniqueEntityID } from '../../../_shared/domain/unique-entity-id';
import { AggregateRoot } from "../../../_shared/domain/aggregate-root";
import { TipoMetal } from '../../enums/tipo-metal.enum';

export interface MetalCreditProps {
  clientId: string;
  chemicalAnalysisId: string;
  metalType: TipoMetal;
  grams: number;
  date: Date;
  organizationId: string;
}

export class MetalCredit extends AggregateRoot<MetalCreditProps> {
  private constructor(props: MetalCreditProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: MetalCreditProps, id?: UniqueEntityID): MetalCredit {
    return new MetalCredit(props, id);
  }

  get clientId(): string { return this.props.clientId; }
  get chemicalAnalysisId(): string { return this.props.chemicalAnalysisId; }
  get metalType(): TipoMetal { return this.props.metalType; }
  get grams(): number { return this.props.grams; }
  get date(): Date { return this.props.date; }
  get organizationId(): string { return this.props.organizationId; }
}