import { AnaliseQuimica, StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';

export class AnaliseQuimicaResponseDto {
  id!: string;
  clienteId!: string;
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

  static fromDomain(analise: AnaliseQuimica): AnaliseQuimicaResponseDto {
    // Mapeamento explícito usando os getters da entidade
    return {
      id: analise.id,
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
  }

  static fromDomainArray(
    analises: AnaliseQuimica[],
    // ...restante do método se necessário
  ) {
    return analises.map(this.fromDomain);
  }
}
