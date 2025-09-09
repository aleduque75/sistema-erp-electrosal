import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IAnaliseQuimicaRepository,
  AnaliseQuimica,
} from '@sistema-erp-electrosal/core';

@Injectable()
export class BuscarAnaliseQuimicaPorIdUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly repo: IAnaliseQuimicaRepository,
  ) {}

  async execute(id: string): Promise<AnaliseQuimica> {
    const analise = await this.repo.findById(id);
    if (!analise) {
      throw new NotFoundException(
        `Análise Química com ID ${id} não encontrada.`,
      );
    }
    return analise;
  }
}
