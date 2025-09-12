import { Inject, Injectable, ConflictException } from '@nestjs/common';
import {
  IAnaliseQuimicaRepository,
  AnaliseQuimica,
  AnaliseQuimicaProps,
  StatusAnaliseQuimica,
} from '@sistema-erp-electrosal/core';
import { RegistrarNovaAnaliseDto } from '../dtos/registrar-nova-analise.dto';

export interface RegistrarNovaAnaliseCommand {
  dto: RegistrarNovaAnaliseDto;
  organizationId: string;
}

@Injectable()
export class RegistrarNovaAnaliseUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
  ) {}

  async execute(command: RegistrarNovaAnaliseCommand): Promise<AnaliseQuimica> {
    const { dto, organizationId } = command;
    if (await this.analiseRepo.findByNumeroAnalise(dto.numeroAnalise)) {
      throw new ConflictException(
        'Já existe uma análise química com este número.',
      );
    }

    const props: Omit<
      AnaliseQuimicaProps,
      'id' | 'dataCriacao' | 'dataAtualizacao'
    > = {
      clienteId: dto.clienteId,
      numeroAnalise: dto.numeroAnalise,
      dataEntrada: dto.dataEntrada,
      descricaoMaterial: dto.descricaoMaterial,
      volumeOuPesoEntrada: dto.volumeOuPesoEntrada,
      unidadeEntrada: dto.unidadeEntrada,
      
      observacoes: dto.observacoes ?? null,
      resultadoAnaliseValor: null,
      unidadeResultado: null,
      percentualQuebra: null,
      taxaServicoPercentual: null,
      teorRecuperavel: null,
      auEstimadoBrutoGramas: null,
      auEstimadoRecuperavelGramas: null,
      taxaServicoEmGramas: null,
      auLiquidoParaClienteGramas: null,
      dataAnaliseConcluida: null,
      dataAprovacaoCliente: null,
      dataFinalizacaoRecuperacao: null,
      ordemDeRecuperacaoId: null,
    };

    const novaAnalise = AnaliseQuimica.criar(props);
    return this.analiseRepo.create(novaAnalise, organizationId);
  }
}
