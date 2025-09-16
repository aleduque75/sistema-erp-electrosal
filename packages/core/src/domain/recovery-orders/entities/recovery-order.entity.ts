import { UniqueEntityID } from '../../../_shared/domain/unique-entity-id';
import { AggregateRoot } from "../../../_shared/domain/aggregate-root";
import { RecoveryOrderStatus } from "../recovery-order-status.enum";

export interface RecoveryOrderProps {
  organizationId: string;
  chemicalAnalysisIds: string[];
  status: RecoveryOrderStatus;
  dataInicio: Date;
  dataFim?: Date;
  descricaoProcesso?: string;
  volumeProcessado?: number;
  unidadeProcessada?: string;
  resultadoFinal?: number;
  unidadeResultado?: string;
  observacoes?: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export class RecoveryOrder extends AggregateRoot<RecoveryOrderProps> {
  private constructor(props: RecoveryOrderProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: Omit<RecoveryOrderProps, 'dataCriacao' | 'dataAtualizacao' | 'status'>, id?: UniqueEntityID): RecoveryOrder {
    const now = new Date();
    const recoveryOrder = new RecoveryOrder(
      {
        ...props,
        status: RecoveryOrderStatus.PENDENTE,
        dataCriacao: now,
        dataAtualizacao: now,
      },
      id,
    );
    return recoveryOrder;
  }

  public static reconstitute(props: RecoveryOrderProps, id: UniqueEntityID): RecoveryOrder {
    return new RecoveryOrder(props, id);
  }

  get organizationId(): string { return this.props.organizationId; }
  get chemicalAnalysisIds(): string[] { return this.props.chemicalAnalysisIds; }
  get status(): RecoveryOrderStatus { return this.props.status; }
  get dataInicio(): Date { return this.props.dataInicio; }
  get dataFim(): Date | undefined { return this.props.dataFim; }
  get descricaoProcesso(): string | undefined { return this.props.descricaoProcesso; }
  get volumeProcessado(): number | undefined { return this.props.volumeProcessado; }
  get unidadeProcessada(): string | undefined { return this.props.unidadeProcessada; }
  get resultadoFinal(): number | undefined { return this.props.resultadoFinal; }
  get unidadeResultado(): string | undefined { return this.props.unidadeResultado; }
  get observacoes(): string | undefined { return this.props.observacoes; }
  get dataCriacao(): Date { return this.props.dataCriacao; }
  get dataAtualizacao(): Date { return this.props.dataAtualizacao; }

  public update(dto: Partial<RecoveryOrderProps>) {
    Object.assign(this.props, dto);
    this.props.dataAtualizacao = new Date();
  }
}
