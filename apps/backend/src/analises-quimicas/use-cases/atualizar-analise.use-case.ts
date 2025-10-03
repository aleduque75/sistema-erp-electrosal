import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IAnaliseQuimicaRepository, AnaliseQuimica, AnaliseQuimicaProps, AtualizarAnaliseDto } from '@sistema-erp-electrosal/core';

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
