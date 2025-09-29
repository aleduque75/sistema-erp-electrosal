import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core/domain/enums/status-analise-quimica.enum';
import { AnaliseQuimica, AnaliseQuimicaProps, IAnaliseQuimicaRepository } from '@sistema-erp-electrosal/core';
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

    const lastNumeroAnalise = await this.analiseRepo.findLastNumeroAnalise(organizationId);
    let nextNumber = 1;
    if (lastNumeroAnalise) {
      const lastNumber = parseInt(lastNumeroAnalise.split('-')[1], 10);
      nextNumber = lastNumber + 1;
    }
    const newNumeroAnalise = `AQ-${nextNumber.toString().padStart(3, '0')}`;

    const props: Omit<
      AnaliseQuimicaProps,
      'id' | 'dataCriacao' | 'dataAtualizacao' | 'status'
    > = {
      clienteId: dto.clienteId,
      numeroAnalise: newNumeroAnalise,
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
