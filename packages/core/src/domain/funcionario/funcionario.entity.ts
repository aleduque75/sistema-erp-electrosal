import { AggregateRoot } from '../../_shared/domain/aggregate-root';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface FuncionarioProps {
  pessoaId: UniqueEntityID;
  organizationId: UniqueEntityID;
  hireDate: Date;
  position?: string;
}

export class Funcionario extends AggregateRoot<FuncionarioProps> {
  private constructor(props: FuncionarioProps, id: UniqueEntityID) {
    super(props, id);
  }

  // The ID of the Funcionario aggregate is the same as the Pessoa ID.
  public static create(props: FuncionarioProps): Funcionario {
    const funcionario = new Funcionario(
      {
        ...props,
      },
      props.pessoaId, // The aggregate ID is the pessoaId
    );
    return funcionario;
  }

  get pessoaId(): UniqueEntityID {
    return this.props.pessoaId;
  }

  get organizationId(): UniqueEntityID {
    return this.props.organizationId;
  }

  get hireDate(): Date {
    return this.props.hireDate;
  }

  get position(): string | undefined {
    return this.props.position;
  }
}
