import { Entity } from '../../_shared/entity';

interface ChemicalReactionProps {
  organizationId: string;
  inputGoldGrams: number;
  inputRawMaterialGrams: number;
  inputBasketLeftoverGrams?: number;
  inputDistillateLeftoverGrams?: number;
  outputProductGrams: number;
  outputBasketLeftoverGrams?: number;
  outputDistillateLeftoverGrams?: number;
  sourceLotId: string;
  outputProductId: string; // Adicionado
  reactionDate: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ChemicalReaction extends Entity<ChemicalReactionProps> {
  private constructor(props: ChemicalReactionProps, id?: string) {
    super(props, id);
  }

  public static create(props: ChemicalReactionProps, id?: string): ChemicalReaction {
    const chemicalReaction = new ChemicalReaction(
      {
        ...props,
        reactionDate: props.reactionDate ?? new Date(),
      },
      id,
    );
    return chemicalReaction;
  }
}
