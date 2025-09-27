import { ChemicalReaction } from '../entities/chemical-reaction.entity';

export interface IChemicalReactionRepository {
  create(chemicalReaction: ChemicalReaction): Promise<ChemicalReaction>;
  findAll(organizationId: string): Promise<ChemicalReaction[]>;
}