export type PessoaRoleType = 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO';

export class PessoaRoleVO {
  private static readonly VALID_ROLES: PessoaRoleType[] = [
    'CLIENT',
    'FORNECEDOR',
    'FUNCIONARIO',
  ];

  private readonly _value: PessoaRoleType;

  private constructor(value: PessoaRoleType) {
    this._value = value;
  }

  static create(role: string): PessoaRoleVO {
    const normalized = role?.trim().toUpperCase() as PessoaRoleType;

    if (!PessoaRoleVO.VALID_ROLES.includes(normalized)) {
      throw new Error(`Papel inválido: "${role}". Papéis permitidos: ${PessoaRoleVO.VALID_ROLES.join(', ')}`);
    }

    return new PessoaRoleVO(normalized);
  }

  static isValid(role: string): boolean {
    const normalized = role?.trim().toUpperCase() as PessoaRoleType;
    return PessoaRoleVO.VALID_ROLES.includes(normalized);
  }

  get value(): PessoaRoleType {
    return this._value;
  }

  equals(other: PessoaRoleVO): boolean {
    if (!other) return false;
    return this._value === other.value;
  }

  toString(): string {
    return this._value;
  }
}
