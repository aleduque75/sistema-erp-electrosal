import { AggregateRoot } from '../../ddd/aggregate-root';

export enum StatusRecuperacao {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

export interface RecuperacaoProps {
  id: string;
  organizationId: string;
  analiseQuimicaId: string;
  dataInicio: Date;
  dataFim: Date | null;
  descricaoProcesso: string | null;
  volumeProcessado: number | null;
  unidadeProcessada: string | null;
  resultadoFinal: number | null;
  unidadeResultado: string | null;
  status: StatusRecuperacao;
  observacoes: string | null;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export class Recuperacao extends AggregateRoot {
  private props: RecuperacaoProps;

  constructor(props: RecuperacaoProps) {
    super();
    this.props = props;
  }

  get id() { return this.props.id; }
  get organizationId() { return this.props.organizationId; }
  get analiseQuimicaId() { return this.props.analiseQuimicaId; }
  get dataInicio() { return this.props.dataInicio; }
  get dataFim() { return this.props.dataFim; }
  get descricaoProcesso() { return this.props.descricaoProcesso; }
  get volumeProcessado() { return this.props.volumeProcessado; }
  get unidadeProcessada() { return this.props.unidadeProcessada; }
  get resultadoFinal() { return this.props.resultadoFinal; }
  get unidadeResultado() { return this.props.unidadeResultado; }
  get status() { return this.props.status; }
  get observacoes() { return this.props.observacoes; }
  get dataCriacao() { return this.props.dataCriacao; }
  get dataAtualizacao() { return this.props.dataAtualizacao; }

  // Métodos de domínio podem ser adicionados aqui
}
