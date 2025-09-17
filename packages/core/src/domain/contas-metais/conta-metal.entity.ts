import { AggregateRoot } from '../../_shared/domain/aggregate-root';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';
import { TipoMetal } from './tipo-metal.enum';

export interface ContaMetalProps {
  organizationId: string;
  name: string;
  metalType: TipoMetal;
  balance: number; // Saldo em gramas
  dataCriacao: Date;
  dataAtualizacao: Date;
  pessoaId?: string; // ADDED - Opcional, para contas de metal de clientes
}

export class ContaMetal extends AggregateRoot<ContaMetalProps> {
  private constructor(props: ContaMetalProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<ContaMetalProps, 'dataCriacao' | 'dataAtualizacao' | 'balance'> & { pessoaId?: string }, // MODIFIED to accept pessoaId
    id?: UniqueEntityID,
  ): ContaMetal {
    const now = new Date();
    const contaMetal = new ContaMetal(
      {
        ...props,
        balance: 0, // Saldo inicial é 0
        dataCriacao: now,
        dataAtualizacao: now,
      },
      id,
    );
    return contaMetal;
  }

  public static reconstitute(props: ContaMetalProps, id: UniqueEntityID): ContaMetal {
    return new ContaMetal(props, id);
  }

  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get metalType(): TipoMetal { return this.props.metalType; }
  get balance(): number { return this.props.balance; }
  get dataCriacao(): Date { return this.props.dataCriacao; }
  get dataAtualizacao(): Date { return this.props.dataAtualizacao; }

  public credit(
    creditDetails: {
      gramas: number;
      data?: Date;
      origemId?: string;
      origemTipo?: string;
      observacao?: string;
    }
  ): void {
    if (creditDetails.gramas <= 0) {
      throw new Error('O valor a ser creditado deve ser positivo.');
    }
    this.props.balance += creditDetails.gramas;
    this.props.dataAtualizacao = creditDetails.data || new Date();
    // Note: The additional details (origemId, origemTipo, observacao) are not stored in ContaMetalProps
    // If these need to be persisted, a separate MetalTransaction entity is required.
  }

  public debit(amount: number): void {
    if (amount <= 0) {
      throw new Error('O valor a ser debitado deve ser positivo.');
    }
    if (this.props.balance < amount) {
      throw new Error('Saldo insuficiente para realizar o débito.');
    }
    this.props.balance -= amount;
    this.props.dataAtualizacao = new Date();
  }

  public update(dto: Partial<Omit<ContaMetalProps, 'organizationId' | 'metalType' | 'dataCriacao' | 'balance'>>) {
    Object.assign(this.props, dto);
    this.props.dataAtualizacao = new Date();
  }
}
