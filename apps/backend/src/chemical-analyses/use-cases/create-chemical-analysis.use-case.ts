import { Injectable, ConflictException } from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';
import { CreateChemicalAnalysisDto } from '../dtos/chemical-analysis.dto';
import { ChemicalAnalysisEntity } from '../entities/chemical-analysis.entity';
import { ChemicalAnalysisMapper } from '../mappers/chemical-analysis.mapper';

@Injectable()
export class CreateChemicalAnalysisUseCase {
  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {}

  async execute(organizationId: string, dto: CreateChemicalAnalysisDto, tx?: any) {
    let numeroAnalise: string;

    if (!dto.numeroAnalise || dto.numeroAnalise.trim() === '') {
      let isUnique = false;
      let generatedNumber = '';
      while (!isUnique) {
        generatedNumber = await this.chemicalAnalysesRepository.getNextCrrNumber(organizationId, tx);
        const existing = await this.chemicalAnalysesRepository.findByNumeroAnalise(
          generatedNumber,
          organizationId,
          tx,
        );
        if (!existing) {
          isUnique = true;
        }
      }
      numeroAnalise = generatedNumber;
    } else {
      numeroAnalise = dto.numeroAnalise.trim();
      const existing = await this.chemicalAnalysesRepository.findByNumeroAnalise(
        numeroAnalise,
        organizationId,
        tx,
      );

      if (existing) {
        throw new ConflictException(
          `Já existe uma análise com o número "${numeroAnalise}" nesta organização.`,
        );
      }
    }

    const entity = ChemicalAnalysisEntity.create({
      organizationId,
      clienteId: dto.clienteId,
      numeroAnalise,
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
