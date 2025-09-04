import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface ClientProps {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  gender?: string;
  preferences?: object; // Prisma Json type maps to object in TypeScript
  purchaseHistory?: object; // Prisma Json type maps to object in TypeScript
  cpf?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Client extends Entity<ClientProps> {
  private constructor(props: ClientProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: ClientProps, id?: UniqueEntityID): Client {
    const client = new Client(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return client;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get birthDate(): Date | undefined {
    return this.props.birthDate;
  }

  get cep(): string | undefined {
    return this.props.cep;
  }

  get logradouro(): string | undefined {
    return this.props.logradouro;
  }

  get numero(): string | undefined {
    return this.props.numero;
  }

  get complemento(): string | undefined {
    return this.props.complemento;
  }

  get bairro(): string | undefined {
    return this.props.bairro;
  }

  get cidade(): string | undefined {
    return this.props.cidade;
  }

  get uf(): string | undefined {
    return this.props.uf;
  }

  get gender(): string | undefined {
    return this.props.gender;
  }

  get preferences(): object | undefined {
    return this.props.preferences;
  }

  get purchaseHistory(): object | undefined {
    return this.props.purchaseHistory;
  }

  get cpf(): string | undefined {
    return this.props.cpf;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<ClientProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
