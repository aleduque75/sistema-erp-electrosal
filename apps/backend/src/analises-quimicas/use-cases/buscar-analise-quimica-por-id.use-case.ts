import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IAnaliseQuimicaRepository,
  AnaliseQuimica,
} from '@sistema-erp-electrosal/core';
import { AnaliseQuimicaWithClientNameDto } from '../dtos/analise-quimica-with-client-name.dto';

@Injectable()
export class BuscarAnaliseQuimicaPorIdUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly repo: IAnaliseQuimicaRepository,
  ) {}

  async execute(id: string, organizationId: string): Promise<AnaliseQuimicaWithClientNameDto> {
    const analise = await this.repo.findById(id, organizationId);
    if (!analise) {
      throw new NotFoundException(
        `Análise Química com ID ${id} não encontrada.`,
      );
    }
    return analise;
  }
}
