import { Injectable } from '@nestjs/common';
import { ChemicalAnalysesRepository, ChemicalAnalysesFilters } from '../repositories/chemical-analyses.repository';

@Injectable()
export class ListChemicalAnalysesUseCase {
  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {}

  async execute(organizationId: string, filters?: ChemicalAnalysesFilters) {
    return this.chemicalAnalysesRepository.findAll(organizationId, filters);
  }
}
