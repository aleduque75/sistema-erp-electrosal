import { ChemicalReaction } from '../entities/chemical-reaction.entity';

export interface IChemicalReactionRepository {
  create(chemicalReaction: ChemicalReaction): Promise<ChemicalReaction>;
  findByReactionNumber(reactionNumber: string, organizationId: string): Promise<ChemicalReaction | null>;
  findAll(organizationId: string): Promise<ChemicalReaction[]>;
}