import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';
// import { TipoTransacaoPrisma } from '../enums/tipo-transacao.enum'; // Remover ou ajustar se não for mais usado

export interface MetalAccountEntryProps {
  metalAccountId: UniqueEntityID; // Renomeado de contaMetalId
  type: string; // Renomeado de tipo, e tipo ajustado para string (e.g., 'recovery', 'sale', 'transfer')
  grams: number; // Renomeado de valor
  date: Date;
  sourceId?: string; // Renomeado de relatedTransactionId
  description?: string;
}

export class MetalAccountEntry extends Entity<MetalAccountEntryProps> {
  private constructor(props: MetalAccountEntryProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: MetalAccountEntryProps, id?: UniqueEntityID): MetalAccountEntry {
    return new MetalAccountEntry(props, id);
  }

  get metalAccountId(): UniqueEntityID { return this.props.metalAccountId; } // Renomeado
  get type(): string { return this.props.type; } // Renomeado
  get grams(): number { return this.props.grams; } // Renomeado
  get date(): Date { return this.props.date; }
  get sourceId(): string | undefined { return this.props.sourceId; } // Renomeado
  get description(): string | undefined { return this.props.description; }
}