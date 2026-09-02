import { PessoaRoleVO } from './pessoa-role.vo';

describe('PessoaRoleVO', () => {
  it('should create valid roles', () => {
    expect(PessoaRoleVO.create('CLIENT').value).toBe('CLIENT');
    expect(PessoaRoleVO.create('fornecedor').value).toBe('FORNECEDOR');
    expect(PessoaRoleVO.create(' Funcionario ').value).toBe('FUNCIONARIO');
  });

  it('should throw error on invalid role', () => {
    expect(() => PessoaRoleVO.create('INVALID_ROLE')).toThrow('Papel inválido');
    expect(() => PessoaRoleVO.create('')).toThrow('Papel inválido');
  });

  it('should correctly validate role validity with isValid', () => {
    expect(PessoaRoleVO.isValid('CLIENT')).toBe(true);
    expect(PessoaRoleVO.isValid('FORNECEDOR')).toBe(true);
    expect(PessoaRoleVO.isValid('FUNCIONARIO')).toBe(true);
    expect(PessoaRoleVO.isValid('ADMIN')).toBe(false);
  });

  it('should compare roles with equals', () => {
    const role1 = PessoaRoleVO.create('CLIENT');
    const role2 = PessoaRoleVO.create('client');
    const role3 = PessoaRoleVO.create('FORNECEDOR');

    expect(role1.equals(role2)).toBe(true);
    expect(role1.equals(role3)).toBe(false);
  });
});
