import { AggregateRoot } from '../../_shared/domain/aggregate-root';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';
import { TipoMetal } from '../enums/tipo-metal.enum';

export interface ChemicalReactionProps {
  organizationId: string;
  reactionNumber: string;
  metalType: TipoMetal;
  reactionDate: Date;
  notes?: string;
  // Inputs
  inputGoldGrams: number;
  inputRawMaterialGrams: number;
  inputBasketLeftoverGrams?: number;
  inputDistillateLeftoverGrams?: number;
  // Outputs
  outputProductGrams: number;
  outputBasketLeftoverGrams?: number;
  outputDistillateLeftoverGrams?: number;
  // Rastreabilidade
  sourceLots: { pureMetalLotId: string; gramsToUse: number }[];
}

export class ChemicalReaction extends AggregateRoot<ChemicalReactionProps> {
  private constructor(props: ChemicalReactionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: Omit<ChemicalReactionProps, 'sourceLots'> & { reactionNumber: string, sourceLots: { pureMetalLotId: string; gramsToUse: number }[] }, id?: UniqueEntityID): ChemicalReaction {
    const chemicalReaction = new ChemicalReaction(
      {
        ...props,
      },
      id,
    );
    return chemicalReaction;
  }

  get reactionNumber(): string { return this.props.reactionNumber; }
  get metalType(): TipoMetal { return this.props.metalType; }

  // Adicionar getters conforme necessário
}