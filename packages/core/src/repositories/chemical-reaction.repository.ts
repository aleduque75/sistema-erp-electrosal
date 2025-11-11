import { ChemicalReaction } from '../domain/entities/chemical-reaction.entity';

export interface IChemicalReactionRepository {
  create(chemicalReaction: ChemicalReaction): Promise<ChemicalReaction>;
  save(chemicalReaction: ChemicalReaction): Promise<void>;
  findByReactionNumber(reactionNumber: string, organizationId: string): Promise<ChemicalReaction | null>;
  findAll(organizationId: string): Promise<ChemicalReaction[]>;
}
