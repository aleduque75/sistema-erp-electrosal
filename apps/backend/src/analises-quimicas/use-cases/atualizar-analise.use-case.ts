import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IAnaliseQuimicaRepository } from 'domain/analises-quimicas';
import { AnaliseQuimica, AnaliseQuimicaProps } from '@sistema-erp-electrosal/core';
import { AtualizarAnaliseDto } from '../dtos/atualizar-analise.dto';

@Injectable()
export class AtualizarAnaliseUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
  ) {}

  async execute({ id, organizationId, dto }: { id: string; organizationId: string; dto: AtualizarAnaliseDto }) {
    const analise = await this.analiseRepo.findById(id, organizationId);
    if (!analise) {
      throw new NotFoundException(`Análise com ID ${id} não encontrada.`);
    }

    analise.update(dto);

    return this.analiseRepo.save(analise, organizationId);
  }
}
