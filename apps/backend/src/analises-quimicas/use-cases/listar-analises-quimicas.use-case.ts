import { Inject, Injectable } from '@nestjs/common';
import {
  FiltrosAnaliseQuimica,
  IAnaliseQuimicaRepository,
} from '@sistema-erp-electrosal/core';
import { AnaliseQuimicaResponseDto } from '../dtos/analise-quimica.response.dto';

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
    const { filtros, organizationId } = command;
    const analises = await this.analiseRepo.findAll({
      ...filtros,
      organizationId,
    });
    return AnaliseQuimicaResponseDto.fromDomainArray(analises);
  }
}
