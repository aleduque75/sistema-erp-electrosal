import { Inject, Injectable } from '@nestjs/common';
import {
  FiltrosAnaliseQuimica,
  IAnaliseQuimicaRepository,
} from '@sistema-erp-electrosal/core';
import { AnaliseQuimicaResponseDto } from '@sistema-erp-electrosal/core';

@Injectable()
export class ListarAnalisesQuimicasUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
  ) {}

  async execute(command: {
    filtros?: FiltrosAnaliseQuimica;
    organizationId: string;
  }) {
    if (!command) {
      throw new Error('Command object is required');
    }
    const filtros = command?.filtros;
    const organizationId = command?.organizationId;
    const analises = await this.analiseRepo.findAll({
      ...filtros,
      organizationId,
    });
    return AnaliseQuimicaResponseDto.fromDomainArray(analises);
  }
}
