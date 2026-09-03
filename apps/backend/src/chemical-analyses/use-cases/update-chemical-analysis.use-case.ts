import { Injectable, NotFoundException } from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';
import { UpdateChemicalAnalysisDto } from '../dtos/chemical-analysis.dto';
import { ChemicalAnalysisMapper } from '../mappers/chemical-analysis.mapper';

@Injectable()
export class UpdateChemicalAnalysisUseCase {
  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {}

  async execute(organizationId: string, id: string, dto: UpdateChemicalAnalysisDto) {
    const analysis = await this.chemicalAnalysesRepository.findById(id, organizationId);
    if (!analysis) {
      throw new NotFoundException(`Análise química com ID ${id} não encontrada.`);
    }

    analysis.updateDetails({
      clienteId: dto.clienteId !== undefined ? dto.clienteId : analysis.clienteId,
      numeroAnalise: dto.numeroAnalise !== undefined ? dto.numeroAnalise : analysis.numeroAnalise,
      dataEntrada: dto.dataEntrada ? new Date(dto.dataEntrada) : analysis.dataEntrada,
      descricaoMaterial: dto.descricaoMaterial !== undefined ? dto.descricaoMaterial : analysis.descricaoMaterial,
      volumeOuPesoEntrada: dto.volumeOuPesoEntrada !== undefined ? dto.volumeOuPesoEntrada : analysis.volumeOuPesoEntrada,
      unidadeEntrada: dto.unidadeEntrada !== undefined ? dto.unidadeEntrada : analysis.unidadeEntrada,
      resultadoAnaliseValor: dto.resultadoAnaliseValor !== undefined ? dto.resultadoAnaliseValor : analysis.resultadoAnaliseValor,
      unidadeResultado: dto.unidadeResultado !== undefined ? dto.unidadeResultado : analysis.unidadeResultado,
      percentualQuebra: dto.percentualQuebra !== undefined ? dto.percentualQuebra : analysis.percentualQuebra,
      taxaServicoPercentual: dto.taxaServicoPercentual !== undefined ? dto.taxaServicoPercentual : analysis.taxaServicoPercentual,
      observacoes: dto.observacoes !== undefined ? dto.observacoes : analysis.observacoes,
      metalType: dto.metalType !== undefined ? dto.metalType : analysis.metalType,
    });

    if (dto.resultadoAnaliseValor !== undefined || dto.volumeOuPesoEntrada !== undefined) {
      analysis.calculateYield();
    }

    const saved = await this.chemicalAnalysesRepository.save(analysis);
    return ChemicalAnalysisMapper.toResponseDto(saved);
  }
}
