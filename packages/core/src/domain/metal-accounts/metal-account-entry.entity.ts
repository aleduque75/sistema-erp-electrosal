import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';
import { TipoTransacaoPrisma } from '../enums/tipo-transacao.enum';

export interface MetalAccountEntryProps {
  contaMetalId: UniqueEntityID;
  tipo: TipoTransacaoPrisma;
  valor: number;
  data: Date;
  relatedTransactionId?: string;
  description?: string;
}

export class MetalAccountEntry extends Entity<MetalAccountEntryProps> {
  private constructor(props: MetalAccountEntryProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: MetalAccountEntryProps, id?: UniqueEntityID): MetalAccountEntry {
    return new MetalAccountEntry(props, id);
  }

  get contaMetalId(): UniqueEntityID { return this.props.contaMetalId; }
  get tipo(): TipoTransacaoPrisma { return this.props.tipo; }
  get valor(): number { return this.props.valor; }
  get data(): Date { return this.props.data; }
  get relatedTransactionId(): string | undefined { return this.props.relatedTransactionId; }
  get description(): string | undefined { return this.props.description; }
}