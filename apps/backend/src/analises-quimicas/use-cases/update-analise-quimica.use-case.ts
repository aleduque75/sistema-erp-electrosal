import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAnaliseQuimicaRepository, UpdateAnaliseQuimicaDto, AnaliseQuimica } from '@sistema-erp-electrosal/core';

export interface UpdateAnaliseQuimicaCommand {
  id: string;
  dto: UpdateAnaliseQuimicaDto;
  organizationId: string;
}

@Injectable()
export class UpdateAnaliseQuimicaUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
  ) {}

  async execute(command: UpdateAnaliseQuimicaCommand): Promise<AnaliseQuimica> {
    const { id, dto, organizationId } = command;

    const analise = await this.analiseRepo.findById(id, organizationId);

    if (!analise) {
      throw new NotFoundException(`Análise química com ID ${id} não encontrada.`);
    }

    analise.update(dto);

    return this.analiseRepo.save(analise, organizationId);
  }
}
