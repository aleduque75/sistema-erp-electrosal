import { Injectable, NotFoundException } from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';

@Injectable()
export class GetChemicalAnalysisByIdUseCase {
  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {}

  async execute(organizationId: string, id: string) {
    const analysis = await this.chemicalAnalysesRepository.findByIdWithDetails(id, organizationId);
    if (!analysis) {
      throw new NotFoundException(`Análise química com ID ${id} não encontrada.`);
    }
    return analysis;
  }
}
