import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';
import { AggregateRoot } from "../../_shared/domain/aggregate-root";
import { StatusAnaliseQuimica } from "../enums/status-analise-quimica.enum";
import { nanoid } from 'nanoid';

export interface AnaliseQuimicaProps {
  id?: string;
  clienteId: string;
  cliente?: { name: string };
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
  private constructor(props: AnaliseQuimicaProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static criar(
    props: Omit<AnaliseQuimicaProps, 'id' | 'dataCriacao' | 'dataAtualizacao'>,
  ): AnaliseQuimica {
    const now = new Date();
    const analise = new AnaliseQuimica(
      {
        ...props,
        dataCriacao: now,
        dataAtualizacao: now,
        status: StatusAnaliseQuimica.EM_ANALISE, // Define o status inicial como EM_ANALISE
      },
      UniqueEntityID.create(),
    );
    return analise;
  }

  public static reconstituir(props: AnaliseQuimicaProps, id: UniqueEntityID): AnaliseQuimica {
    return new AnaliseQuimica(props, id);
  }

  get clienteId(): string { return this.props.clienteId; }
  get cliente(): { name: string } | undefined { return this.props.cliente; }
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

  public lancarResultado(dto: {
    resultadoAnaliseValor: number;
    unidadeResultado: string;
    percentualQuebra: number;
    taxaServicoPercentual: number;
    observacoes?: string;
  }) {
    // --- Atualiza as propriedades diretas do DTO ---
    this.props.resultadoAnaliseValor = dto.resultadoAnaliseValor;
    this.props.unidadeResultado = dto.unidadeResultado;
    this.props.percentualQuebra = dto.percentualQuebra;
    this.props.taxaServicoPercentual = dto.taxaServicoPercentual;
    if (dto.observacoes) {
      this.props.observacoes = dto.observacoes;
    }

    // --- Realiza os cálculos de negócio ---
    // Assume que resultadoAnaliseValor é em g/kg e volumeOuPesoEntrada é em kg
    const auEstimadoBrutoGramas = this.props.volumeOuPesoEntrada * this.props.resultadoAnaliseValor;
    this.props.auEstimadoBrutoGramas = auEstimadoBrutoGramas;

    const teorRecuperavel = this.props.resultadoAnaliseValor * (1 - this.props.percentualQuebra);
    this.props.teorRecuperavel = teorRecuperavel;

    const auEstimadoRecuperavelGramas = auEstimadoBrutoGramas * (1 - this.props.percentualQuebra);
    this.props.auEstimadoRecuperavelGramas = auEstimadoRecuperavelGramas;

    const taxaServicoEmGramas = auEstimadoRecuperavelGramas * this.props.taxaServicoPercentual;
    this.props.taxaServicoEmGramas = taxaServicoEmGramas;

    const auLiquidoParaClienteGramas = auEstimadoRecuperavelGramas - taxaServicoEmGramas;
    this.props.auLiquidoParaClienteGramas = auLiquidoParaClienteGramas;

    // --- Atualiza status e datas ---
    this.props.status = StatusAnaliseQuimica.ANALISADO_AGUARDANDO_APROVACAO;
    this.props.dataAnaliseConcluida = new Date();
    this.props.dataAtualizacao = new Date();
  }
  
  public aprovarParaRecuperacao() {
      this.props.status = StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO;
      this.props.dataAprovacaoCliente = new Date();
      this.props.dataAtualizacao = new Date();
  }

  public reprovar() {
      this.props.status = StatusAnaliseQuimica.RECUSADO_PELO_CLIENTE;
      this.props.dataAtualizacao = new Date();
  }

  public refazer() {
      this.props.status = StatusAnaliseQuimica.EM_ANALISE;
      this.props.dataAtualizacao = new Date();
  }

  public static criarResiduo(props: Omit<AnaliseQuimicaProps, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'status' | 'numeroAnalise' | 'clienteId'> & { organizationId: string }): AnaliseQuimica {
    const now = new Date();
    const analise = new AnaliseQuimica(
      {
        ...props,
        clienteId: 'SYSTEM_RESIDUE', // A specific client ID for residue
        numeroAnalise: `RESIDUO-${nanoid(8)}`, // Generate a unique number for residue analysis
        dataEntrada: now,
        status: StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO, // A new status for residue
        dataCriacao: now,
        dataAtualizacao: now,
      },
      UniqueEntityID.create(),
    );
    return analise;
  }

  public update(dto: Partial<AnaliseQuimicaProps>) {
    Object.assign(this.props, dto);
    this.props.dataAtualizacao = new Date();
  }

  public toObject(): AnaliseQuimicaProps & { id: string } {
    return {
      id: this.id.toValue(), // Assuming id is a UniqueEntityID
      ...this.props,
      cliente: this.props.cliente,
    };
  }
}