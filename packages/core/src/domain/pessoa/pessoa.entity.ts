import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export type PessoaType = 'FISICA' | 'JURIDICA';

export interface PessoaProps {
  organizationId: string;
  name: string; // Nome da pessoa ou Nome Fantasia da empresa
  type: PessoaType;

  // Campos Pessoa Física
  cpf?: string;
  birthDate?: Date;
  gender?: string;

  // Campos Pessoa Jurídica
  cnpj?: string;
  razaoSocial?: string; // Razão Social

  // Contato e Endereço (Comuns)
  email?: string;
  phone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export class Pessoa extends Entity<PessoaProps> {
  private constructor(props: PessoaProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: PessoaProps, id?: UniqueEntityID): Pessoa {
    const pessoa = new Pessoa(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return pessoa;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }
  get name(): string {
    return this.props.name;
  }
  get type(): PessoaType {
    return this.props.type;
  }
  get cpf(): string | undefined {
    return this.props.cpf;
  }
  get birthDate(): Date | undefined {
    return this.props.birthDate;
  }
  get gender(): string | undefined {
    return this.props.gender;
  }
  get cnpj(): string | undefined {
    return this.props.cnpj;
  }
  get razaoSocial(): string | undefined {
    return this.props.razaoSocial;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get phone(): string | undefined {
    return this.props.phone;
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
  get createdAt(): Date {
    return this.props.createdAt!;
  }
  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<PessoaProps>) {
    // Prevent changing the type after creation
    const { type, ...otherProps } = props;
    if (type && type !== this.props.type) {
      throw new Error('Changing the type of a Pessoa is not allowed.');
    }
    Object.assign(this.props, otherProps);
    this.props.updatedAt = new Date();
  }
}
