import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';

@Injectable()
export class RejectChemicalAnalysisUseCase {
  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {}

  async execute(organizationId: string, id: string): Promise<void> {
    const analysis = await this.chemicalAnalysesRepository.findById(id, organizationId);
    if (!analysis) {
      throw new NotFoundException(`Análise química com ID ${id} não encontrada.`);
    }

    if (!analysis.status.canReject()) {
      throw new ConflictException(
        `Análise não pode ser recusada pois seu status é "${analysis.statusValue}".`,
      );
    }

    analysis.reject();
    await this.chemicalAnalysesRepository.save(analysis);
  }
}
