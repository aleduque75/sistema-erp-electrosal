import { Injectable, ConflictException } from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';
import { CreateChemicalAnalysisDto } from '../dtos/chemical-analysis.dto';
import { ChemicalAnalysisEntity } from '../entities/chemical-analysis.entity';
import { ChemicalAnalysisMapper } from '../mappers/chemical-analysis.mapper';

@Injectable()
export class CreateChemicalAnalysisUseCase {
  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {}

  async execute(organizationId: string, dto: CreateChemicalAnalysisDto, tx?: any) {
    const existing = await this.chemicalAnalysesRepository.findByNumeroAnalise(
      dto.numeroAnalise,
      organizationId,
      tx,
    );

    if (existing) {
      throw new ConflictException(
        `Já existe uma análise com o número "${dto.numeroAnalise}" nesta organização.`,
      );
    }

    const entity = ChemicalAnalysisEntity.create({
      organizationId,
      clienteId: dto.clienteId,
      numeroAnalise: dto.numeroAnalise,
      dataEntrada: dto.dataEntrada,
      descricaoMaterial: dto.descricaoMaterial,
      volumeOuPesoEntrada: dto.volumeOuPesoEntrada,
      unidadeEntrada: dto.unidadeEntrada,
      metalType: dto.metalType,
      observacoes: dto.observacoes,
    });

    const created = await this.chemicalAnalysesRepository.create(entity, tx);
    return ChemicalAnalysisMapper.toResponseDto(created);
  }
}
