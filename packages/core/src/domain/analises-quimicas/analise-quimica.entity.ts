import { AggregateRoot } from "../../ddd/aggregate-root";
import { InvalidArgumentError } from "../../errors/invalid-argument.error";
import { StatusAnaliseQuimica } from "./status-analise-quimica.enum";

export interface AnaliseQuimicaProps {
  id: string;
  clienteId: string;
  numeroAnalise: string;
  dataEntrada: Date;
  descricaoMaterial: string;
  volumeOuPesoEntrada: number;
  unidadeEntrada: string;
  status: StatusAnaliseQuimica;
  resultadoAnaliseValor: number | null;
  unidadeResultado: string | null;
  percentualQuebra: number | null;
  taxaServicoPercentual: number | null;
  teorRecuperavel: number | null;
  auEstimadoBrutoGramas: number | null;
  auEstimadoRecuperavelGramas: number | null;
  taxaServicoEmGramas: number | null;
  auLiquidoParaClienteGramas: number | null;
  dataAnaliseConcluida: Date | null;
  dataAprovacaoCliente: Date | null;
  dataFinalizacaoRecuperacao: Date | null;
  observacoes: string | null;
  ordemDeRecuperacaoId: string | null;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export class AnaliseQuimica extends AggregateRoot {
  private _id: string;
  private _clienteId: string;
  private _numeroAnalise: string;
  private _dataEntrada: Date;
  private _descricaoMaterial: string;
  private _volumeOuPesoEntrada: number;
  private _unidadeEntrada: string;
  private _status: StatusAnaliseQuimica;
  private _resultadoAnaliseValor: number | null;
  private _unidadeResultado: string | null;
  private _percentualQuebra: number | null;
  private _taxaServicoPercentual: number | null;
  private _teorRecuperavel: number | null;
  private _auEstimadoBrutoGramas: number | null;
  private _auEstimadoRecuperavelGramas: number | null;
  private _taxaServicoEmGramas: number | null;
  private _auLiquidoParaClienteGramas: number | null;
  private _dataAnaliseConcluida: Date | null;
  private _dataAprovacaoCliente: Date | null;
  private _dataFinalizacaoRecuperacao: Date | null;
  private _observacoes: string | null;
  private _ordemDeRecuperacaoId: string | null;
  private readonly _dataCriacao: Date;
  private _dataAtualizacao: Date;

  private constructor(props: Partial<AnaliseQuimicaProps>) {
    super();
    this._id = props.id!;
    this._clienteId = props.clienteId!;
    this._numeroAnalise = props.numeroAnalise!;
    this._dataEntrada = props.dataEntrada!;
    this._descricaoMaterial = props.descricaoMaterial!;
    this._volumeOuPesoEntrada = props.volumeOuPesoEntrada!;
    this._unidadeEntrada = props.unidadeEntrada!;
    this._status = props.status!;
    this._resultadoAnaliseValor = props.resultadoAnaliseValor ?? null;
    this._unidadeResultado = props.unidadeResultado ?? null;
    this._percentualQuebra = props.percentualQuebra ?? null;
    this._taxaServicoPercentual = props.taxaServicoPercentual ?? null;
    this._teorRecuperavel = props.teorRecuperavel ?? null;
    this._auEstimadoBrutoGramas = props.auEstimadoBrutoGramas ?? null;
    this._auEstimadoRecuperavelGramas = props.auEstimadoRecuperavelGramas ?? null;
    this._taxaServicoEmGramas = props.taxaServicoEmGramas ?? null;
    this._auLiquidoParaClienteGramas = props.auLiquidoParaClienteGramas ?? null;
    this._dataAnaliseConcluida = props.dataAnaliseConcluida ?? null;
    this._dataAprovacaoCliente = props.dataAprovacaoCliente ?? null;
    this._dataFinalizacaoRecuperacao = props.dataFinalizacaoRecuperacao ?? null;
    this._observacoes = props.observacoes ?? null;
    this._ordemDeRecuperacaoId = props.ordemDeRecuperacaoId ?? null;
    this._dataCriacao = props.dataCriacao!;
    this._dataAtualizacao = props.dataAtualizacao!;
  }

  public alterarDataEntrada(data: Date) {
    this._dataEntrada = data;
  }

  public alterarDescricaoMaterial(descricao: string) {
    this._descricaoMaterial = descricao;
  }

  public alterarVolumeOuPesoEntrada(valor: number) {
    this._volumeOuPesoEntrada = valor;
  }

  public alterarUnidadeEntrada(unidade: string) {
    this._unidadeEntrada = unidade;
  }

  public adicionarOuAlterarObservacoes(obs: string) {
    this._observacoes = obs;
  }

  public lancarResultado(dto: { resultadoAnaliseValor: number, unidadeResultado: string }) {
    this._resultadoAnaliseValor = dto.resultadoAnaliseValor;
    this._unidadeResultado = dto.unidadeResultado;
  }
}
