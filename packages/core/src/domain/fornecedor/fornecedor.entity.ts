import { AggregateRoot } from '../../_shared/domain/aggregate-root';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface FornecedorProps {
  pessoaId: UniqueEntityID;
  organizationId: UniqueEntityID;
}

export class Fornecedor extends AggregateRoot<FornecedorProps> {
  private constructor(props: FornecedorProps, id: UniqueEntityID) {
    super(props, id);
  }

  // The ID of the Fornecedor aggregate is the same as the Pessoa ID.
  public static create(props: FornecedorProps): Fornecedor {
    const fornecedor = new Fornecedor(
      {
        ...props,
      },
      props.pessoaId, // The aggregate ID is the pessoaId
    );
    return fornecedor;
  }

  get pessoaId(): UniqueEntityID {
    return this.props.pessoaId;
  }

  get organizationId(): UniqueEntityID {
    return this.props.organizationId;
  }
}
