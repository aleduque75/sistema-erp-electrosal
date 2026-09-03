import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

    if (dto.numeroAnalise && dto.numeroAnalise !== analysis.numeroAnalise) {
      const existing = await this.chemicalAnalysesRepository.findByNumeroAnalise(
        dto.numeroAnalise,
        organizationId,
      );
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Já existe uma análise com o número "${dto.numeroAnalise}" nesta organização.`,
        );
      }
    }

    analysis.updateDetails({
      clienteId: dto.clienteId !== undefined ? dto.clienteId : analysis.clienteId,
      numeroAnalise: dto.numeroAnalise !== undefined ? dto.numeroAnalise : analysis.numeroAnalise,
      dataEntrada: dto.dataEntrada ? new Date(dto.dataEntrada) : analysis.dataEntrada,
      dataAnaliseConcluida: dto.dataAnaliseConcluida !== undefined 
        ? (dto.dataAnaliseConcluida ? new Date(dto.dataAnaliseConcluida) : null)
        : analysis.dataAnaliseConcluida,
      dataAprovacaoCliente: dto.dataAprovacaoCliente !== undefined
        ? (dto.dataAprovacaoCliente ? new Date(dto.dataAprovacaoCliente) : null)
        : analysis.dataAprovacaoCliente,
      dataFinalizacaoRecuperacao: dto.dataFinalizacaoRecuperacao !== undefined
        ? (dto.dataFinalizacaoRecuperacao ? new Date(dto.dataFinalizacaoRecuperacao) : null)
        : analysis.dataFinalizacaoRecuperacao,
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

    if (
      dto.resultadoAnaliseValor !== undefined ||
      dto.volumeOuPesoEntrada !== undefined ||
      dto.percentualQuebra !== undefined ||
      dto.taxaServicoPercentual !== undefined ||
      dto.unidadeResultado !== undefined
    ) {
      analysis.calculateYield();
    }

    const saved = await this.chemicalAnalysesRepository.save(analysis);
    return ChemicalAnalysisMapper.toResponseDto(saved);
  }
}
