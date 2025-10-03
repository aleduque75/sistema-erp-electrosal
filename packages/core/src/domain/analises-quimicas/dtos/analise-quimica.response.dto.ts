import { AnaliseQuimica } from '../analise-quimica.entity';
import { StatusAnaliseQuimica } from '../../enums/status-analise-quimica.enum';

export class AnaliseQuimicaResponseDto {
  id!: string;
  clienteId!: string | null | undefined;
  numeroAnalise!: string;
  dataEntrada!: Date;
  descricaoMaterial!: string;
  volumeOuPesoEntrada!: number;
  unidadeEntrada!: string;
  status!: StatusAnaliseQuimica;
  resultadoAnaliseValor!: number | null;
  unidadeResultado!: string | null;
  percentualQuebra!: number | null;
  taxaServicoPercentual!: number | null;
  teorRecuperavel!: number | null;
  auEstimadoBrutoGramas!: number | null;
  auEstimadoRecuperavelGramas!: number | null;
  taxaServicoEmGramas!: number | null;
  auLiquidoParaClienteGramas!: number | null;
  dataAnaliseConcluida!: Date | null;
  dataAprovacaoCliente!: Date | null;
  dataFinalizacaoRecuperacao!: Date | null;
  observacoes!: string | null;
  ordemDeRecuperacaoId!: string | null;
  dataCriacao!: Date;
  dataAtualizacao!: Date;
  cliente?: { name: string };

  static fromDomain(analise: AnaliseQuimica): AnaliseQuimicaResponseDto {
    const dto: AnaliseQuimicaResponseDto = {
      id: analise.id.toString(),
      clienteId: analise.clienteId,
      numeroAnalise: analise.numeroAnalise,
      dataEntrada: analise.dataEntrada,
      descricaoMaterial: analise.descricaoMaterial,
      volumeOuPesoEntrada: analise.volumeOuPesoEntrada,
      unidadeEntrada: analise.unidadeEntrada,
      status: analise.status,
      resultadoAnaliseValor: analise.resultadoAnaliseValor,
      unidadeResultado: analise.unidadeResultado,
      percentualQuebra: analise.percentualQuebra,
      taxaServicoPercentual: analise.taxaServicoPercentual,
      teorRecuperavel: analise.teorRecuperavel,
      auEstimadoBrutoGramas: analise.auEstimadoBrutoGramas,
      auEstimadoRecuperavelGramas: analise.auEstimadoRecuperavelGramas,
      taxaServicoEmGramas: analise.taxaServicoEmGramas,
      auLiquidoParaClienteGramas: analise.auLiquidoParaClienteGramas,
      dataAnaliseConcluida: analise.dataAnaliseConcluida,
      dataAprovacaoCliente: analise.dataAprovacaoCliente,
      dataFinalizacaoRecuperacao: analise.dataFinalizacaoRecuperacao,
      observacoes: analise.observacoes,
      ordemDeRecuperacaoId: analise.ordemDeRecuperacaoId,
      dataCriacao: analise.dataCriacao,
      dataAtualizacao: analise.dataAtualizacao,
    };

    if ((analise as any).cliente) {
      dto.cliente = { name: (analise as any).cliente.name };
    }

    return dto;
  }

  static fromDomainArray(
    analises: AnaliseQuimica[],
    // ...restante do método se necessário
  ) {
    return analises.map(this.fromDomain);
  }
}
