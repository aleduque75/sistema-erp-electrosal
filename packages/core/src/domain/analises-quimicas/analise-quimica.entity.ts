import { AggregateRoot } from "../../ddd/aggregate-root";
import { StatusAnaliseQuimica } from "./status-analise-quimica.enum";
import { nanoid } from 'nanoid';

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

export class AnaliseQuimica extends AggregateRoot<AnaliseQuimicaProps> {
  private constructor(props: AnaliseQuimicaProps) {
    super();
    this.props = props;
  }

  public static criar(
    props: Omit<AnaliseQuimicaProps, 'id' | 'dataCriacao' | 'dataAtualizacao'>,
  ): AnaliseQuimica {
    const now = new Date();
    const analise = new AnaliseQuimica({
      ...props,
      id: nanoid(),
      dataCriacao: now,
      dataAtualizacao: now,
    });
    return analise;
  }

  public static reconstituir(props: AnaliseQuimicaProps): AnaliseQuimica {
    return new AnaliseQuimica(props);
  }

  get id(): string { return this.props.id; }
  get clienteId(): string { return this.props.clienteId; }
  get numeroAnalise(): string { return this.props.numeroAnalise; }
  get dataEntrada(): Date { return this.props.dataEntrada; }
  get descricaoMaterial(): string { return this.props.descricaoMaterial; }
  get volumeOuPesoEntrada(): number { return this.props.volumeOuPesoEntrada; }
  get unidadeEntrada(): string { return this.props.unidadeEntrada; }
  get status(): StatusAnaliseQuimica { return this.props.status; }
  get resultadoAnaliseValor(): number | null { return this.props.resultadoAnaliseValor; }
  get unidadeResultado(): string | null { return this.props.unidadeResultado; }
  get percentualQuebra(): number | null { return this.props.percentualQuebra; }
  get taxaServicoPercentual(): number | null { return this.props.taxaServicoPercentual; }
  get teorRecuperavel(): number | null { return this.props.teorRecuperavel; }
  get auEstimadoBrutoGramas(): number | null { return this.props.auEstimadoBrutoGramas; }
  get auEstimadoRecuperavelGramas(): number | null { return this.props.auEstimadoRecuperavelGramas; }
  get taxaServicoEmGramas(): number | null { return this.props.taxaServicoEmGramas; }
  get auLiquidoParaClienteGramas(): number | null { return this.props.auLiquidoParaClienteGramas; }
  get dataAnaliseConcluida(): Date | null { return this.props.dataAnaliseConcluida; }
  get dataAprovacaoCliente(): Date | null { return this.props.dataAprovacaoCliente; }
  get dataFinalizacaoRecuperacao(): Date | null { return this.props.dataFinalizacaoRecuperacao; }
  get observacoes(): string | null { return this.props.observacoes; }
  get ordemDeRecuperacaoId(): string | null { return this.props.ordemDeRecuperacaoId; }
  get dataCriacao(): Date { return this.props.dataCriacao; }
  get dataAtualizacao(): Date { return this.props.dataAtualizacao; }

  public lancarResultado(dto: { resultadoAnaliseValor: number, unidadeResultado: string }) {
    this.props.resultadoAnaliseValor = dto.resultadoAnaliseValor;
    this.props.unidadeResultado = dto.unidadeResultado;
    this.props.status = StatusAnaliseQuimica.ANALISADO_AGUARDANDO_APROVACAO;
    this.props.dataAnaliseConcluida = new Date();
    this.props.dataAtualizacao = new Date();
  }
  
  public aprovarParaRecuperacao() {
      this.props.status = StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO;
      this.props.dataAprovacaoCliente = new Date();
      this.props.dataAtualizacao = new Date();
  }

  public update(dto: Partial<AnaliseQuimicaProps>) {
    Object.assign(this.props, dto);
    this.props.dataAtualizacao = new Date();
  }
}