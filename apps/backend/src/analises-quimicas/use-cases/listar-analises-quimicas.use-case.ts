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

  async execute(filtros?: FiltrosAnaliseQuimica) {
    const analises = await this.analiseRepo.findAll(filtros);
    return AnaliseQuimicaResponseDto.fromDomainArray(analises);
  }
}
