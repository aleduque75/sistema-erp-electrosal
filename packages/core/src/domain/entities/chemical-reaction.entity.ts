import { AggregateRoot } from '../../_shared/domain/aggregate-root';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface ChemicalReactionProps {
  organizationId: string;
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
  sourceLotIds: string[]; // Array de IDs dos lotes de metal puro usados
}

export class ChemicalReaction extends AggregateRoot<ChemicalReactionProps> {
  private constructor(props: ChemicalReactionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: ChemicalReactionProps, id?: UniqueEntityID): ChemicalReaction {
    const chemicalReaction = new ChemicalReaction(
      {
        ...props,
      },
      id,
    );
    return chemicalReaction;
  }

  // Adicionar getters conforme necessário
}