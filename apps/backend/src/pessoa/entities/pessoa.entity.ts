import { PessoaType } from '@prisma/client';
import { PessoaRoleType, PessoaRoleVO } from '../value-objects/pessoa-role.vo';

export interface PessoaProps {
  id?: string;
  organizationId: string;
  name: string;
  type: PessoaType;
  razaoSocial?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  roles?: PessoaRoleType[];
  defaultContaContabilId?: string | null;
  externalId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PessoaEntity {
  private readonly _id?: string;
  private readonly _organizationId: string;
  private _name: string;
  private _type: PessoaType;
  private _razaoSocial?: string | null;
  private _cpf?: string | null;
  private _cnpj?: string | null;
  private _email?: string | null;
  private _phone?: string | null;
  private _birthDate?: Date | null;
  private _gender?: string | null;
  private _cep?: string | null;
  private _logradouro?: string | null;
  private _numero?: string | null;
  private _complemento?: string | null;
  private _bairro?: string | null;
  private _cidade?: string | null;
  private _uf?: string | null;
  private _roles: Set<PessoaRoleType>;
  private _defaultContaContabilId?: string | null;
  private _externalId?: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PessoaProps) {
    if (!props.organizationId?.trim()) {
      throw new Error('A organização é obrigatória para a Pessoa.');
    }
    if (!props.name?.trim()) {
      throw new Error('O nome é obrigatório para a Pessoa.');
    }
    if (!props.type) {
      throw new Error('O tipo de pessoa (FISICA ou JURIDICA) é obrigatório.');
    }

    this._id = props.id;
    this._organizationId = props.organizationId;
    this._name = props.name.trim();
    this._type = props.type;
    this._razaoSocial = props.razaoSocial?.trim() || null;
    this._cpf = props.cpf ? props.cpf.replace(/\D/g, '') : null;
    this._cnpj = props.cnpj ? props.cnpj.replace(/\D/g, '') : null;
    this._email = props.email?.trim() || null;
    this._phone = props.phone?.trim() || null;
    this._birthDate = props.birthDate || null;
    this._gender = props.gender || null;
    this._cep = props.cep ? props.cep.replace(/\D/g, '') : null;
    this._logradouro = props.logradouro?.trim() || null;
    this._numero = props.numero?.trim() || null;
    this._complemento = props.complemento?.trim() || null;
    this._bairro = props.bairro?.trim() || null;
    this._cidade = props.cidade?.trim() || null;
    this._uf = props.uf?.trim().toUpperCase() || null;
    this._defaultContaContabilId = props.defaultContaContabilId || null;
    this._externalId = props.externalId || null;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this._roles = new Set();
    if (props.roles && Array.isArray(props.roles)) {
      props.roles.forEach((r) => this.addRole(r));
    }
  }

  static create(props: PessoaProps): PessoaEntity {
    return new PessoaEntity(props);
  }

  get id(): string | undefined {
    return this._id;
  }
  get organizationId(): string {
    return this._organizationId;
  }
  get name(): string {
    return this._name;
  }
  get type(): PessoaType {
    return this._type;
  }
  get razaoSocial(): string | null | undefined {
    return this._razaoSocial;
  }
  get cpf(): string | null | undefined {
    return this._cpf;
  }
  get cnpj(): string | null | undefined {
    return this._cnpj;
  }
  get email(): string | null | undefined {
    return this._email;
  }
  get phone(): string | null | undefined {
    return this._phone;
  }
  get birthDate(): Date | null | undefined {
    return this._birthDate;
  }
  get gender(): string | null | undefined {
    return this._gender;
  }
  get cep(): string | null | undefined {
    return this._cep;
  }
  get logradouro(): string | null | undefined {
    return this._logradouro;
  }
  get numero(): string | null | undefined {
    return this._numero;
  }
  get complemento(): string | null | undefined {
    return this._complemento;
  }
  get bairro(): string | null | undefined {
    return this._bairro;
  }
  get cidade(): string | null | undefined {
    return this._cidade;
  }
  get uf(): string | null | undefined {
    return this._uf;
  }
  get roles(): PessoaRoleType[] {
    return Array.from(this._roles);
  }
  get defaultContaContabilId(): string | null | undefined {
    return this._defaultContaContabilId;
  }
  get externalId(): string | null | undefined {
    return this._externalId;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  isFisica(): boolean {
    return this._type === PessoaType.FISICA;
  }

  isJuridica(): boolean {
    return this._type === PessoaType.JURIDICA;
  }

  hasRole(role: string): boolean {
    if (!PessoaRoleVO.isValid(role)) return false;
    const vo = PessoaRoleVO.create(role);
    return this._roles.has(vo.value);
  }

  addRole(role: string): void {
    const vo = PessoaRoleVO.create(role);
    this._roles.add(vo.value);
    this._updatedAt = new Date();
  }

  removeRole(role: string): void {
    if (!PessoaRoleVO.isValid(role)) return;
    const vo = PessoaRoleVO.create(role);
    this._roles.delete(vo.value);
    this._updatedAt = new Date();
  }

  assignRoles(roles: string[]): void {
    this._roles.clear();
    roles.forEach((r) => this.addRole(r));
    this._updatedAt = new Date();
  }

  updateDetails(data: Partial<PessoaProps>): void {
    if (data.name !== undefined) {
      if (!data.name?.trim()) throw new Error('O nome não pode ser vazio.');
      this._name = data.name.trim();
    }
    if (data.type !== undefined) {
      this._type = data.type;
    }
    if (data.razaoSocial !== undefined) {
      this._razaoSocial = data.razaoSocial?.trim() || null;
    }
    if (data.cpf !== undefined) {
      this._cpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
    }
    if (data.cnpj !== undefined) {
      this._cnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;
    }
    if (data.email !== undefined) {
      this._email = data.email?.trim() || null;
    }
    if (data.phone !== undefined) {
      this._phone = data.phone?.trim() || null;
    }
    if (data.birthDate !== undefined) {
      this._birthDate = data.birthDate || null;
    }
    if (data.gender !== undefined) {
      this._gender = data.gender || null;
    }
    if (data.cep !== undefined) {
      this._cep = data.cep ? data.cep.replace(/\D/g, '') : null;
    }
    if (data.logradouro !== undefined) {
      this._logradouro = data.logradouro?.trim() || null;
    }
    if (data.numero !== undefined) {
      this._numero = data.numero?.trim() || null;
    }
    if (data.complemento !== undefined) {
      this._complemento = data.complemento?.trim() || null;
    }
    if (data.bairro !== undefined) {
      this._bairro = data.bairro?.trim() || null;
    }
    if (data.cidade !== undefined) {
      this._cidade = data.cidade?.trim() || null;
    }
    if (data.uf !== undefined) {
      this._uf = data.uf?.trim().toUpperCase() || null;
    }
    if (data.defaultContaContabilId !== undefined) {
      this._defaultContaContabilId = data.defaultContaContabilId || null;
    }
    if (data.roles !== undefined) {
      this.assignRoles(data.roles);
    }

    this._updatedAt = new Date();
  }
}
