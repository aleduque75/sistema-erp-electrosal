import { AggregateRoot } from '../../_shared/domain/aggregate-root';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface ClientProps {
  pessoaId: UniqueEntityID; // Use a Value Object for the ID
  organizationId: UniqueEntityID;
}

export class Client extends AggregateRoot<ClientProps> {
  private constructor(props: ClientProps, id: UniqueEntityID) {
    super(props, id);
  }

  // The ID of the Client aggregate is the same as the Pessoa ID.
  public static create(props: ClientProps): Client {
    const client = new Client(
      {
        ...props,
      },
      props.pessoaId, // The aggregate ID is the pessoaId
    );
    return client;
  }

  get pessoaId(): UniqueEntityID {
    return this.props.pessoaId;
  }

  get organizationId(): UniqueEntityID {
    return this.props.organizationId;
  }
}
