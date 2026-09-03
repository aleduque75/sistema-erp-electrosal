import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';
import { PostChemicalAnalysisResultDto } from '../dtos/chemical-analysis.dto';
import { ChemicalAnalysisMapper } from '../mappers/chemical-analysis.mapper';

@Injectable()
export class PostChemicalAnalysisResultUseCase {
  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {}

  async execute(organizationId: string, id: string, dto: PostChemicalAnalysisResultDto) {
    const analysis = await this.chemicalAnalysesRepository.findById(id, organizationId);
    if (!analysis) {
      throw new NotFoundException(`Análise química com ID ${id} não encontrada.`);
    }

    if (!analysis.status.canPostResult()) {
      throw new BadRequestException(
        `Não é possível lançar resultado para uma análise no status "${analysis.statusValue}".`,
      );
    }

    analysis.postResult({
      resultadoAnaliseValor: dto.resultadoAnaliseValor,
      unidadeResultado: dto.unidadeResultado,
      percentualQuebra: dto.percentualQuebra,
      taxaServicoPercentual: dto.taxaServicoPercentual,
      observacoes: dto.observacoes,
    });

    const saved = await this.chemicalAnalysesRepository.save(analysis);
    return ChemicalAnalysisMapper.toResponseDto(saved);
  }
}
