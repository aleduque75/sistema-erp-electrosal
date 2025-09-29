import { ChemicalReaction } from '../entities/chemical-reaction.entity';

export interface IChemicalReactionRepository {
  create(reaction: ChemicalReaction): Promise<ChemicalReaction>;
}
