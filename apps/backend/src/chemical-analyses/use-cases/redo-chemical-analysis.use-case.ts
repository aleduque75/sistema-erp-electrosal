import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';

@Injectable()
export class RedoChemicalAnalysisUseCase {
  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {}

  async execute(organizationId: string, id: string): Promise<void> {
    const analysis = await this.chemicalAnalysesRepository.findById(id, organizationId);
    if (!analysis) {
      throw new NotFoundException(`Análise química com ID ${id} não encontrada.`);
    }

    if (!analysis.status.canRedo()) {
      throw new ConflictException(
        `Análise não pode ser refeita a partir do status "${analysis.statusValue}".`,
      );
    }

    analysis.redo();
    await this.chemicalAnalysesRepository.save(analysis);
  }
}
