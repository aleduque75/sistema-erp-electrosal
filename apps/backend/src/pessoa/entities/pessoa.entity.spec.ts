import { PessoaEntity } from './pessoa.entity';
import { PessoaType } from '@prisma/client';

describe('PessoaEntity', () => {
  const baseProps = {
    organizationId: 'org-123',
    name: 'João Silva',
    type: PessoaType.FISICA,
    cpf: '123.456.789-00',
    email: 'joao@example.com',
  };

  it('should create a valid PessoaEntity', () => {
    const pessoa = PessoaEntity.create(baseProps);

    expect(pessoa.name).toBe('João Silva');
    expect(pessoa.organizationId).toBe('org-123');
    expect(pessoa.type).toBe(PessoaType.FISICA);
    expect(pessoa.cpf).toBe('12345678900'); // Cleaned digits
    expect(pessoa.email).toBe('joao@example.com');
    expect(pessoa.isFisica()).toBe(true);
    expect(pessoa.isJuridica()).toBe(false);
  });

  it('should throw when organizationId is missing', () => {
    expect(() =>
      PessoaEntity.create({
        ...baseProps,
        organizationId: '',
      }),
    ).toThrow('A organização é obrigatória');
  });

  it('should throw when name is missing', () => {
    expect(() =>
      PessoaEntity.create({
        ...baseProps,
        name: '   ',
      }),
    ).toThrow('O nome é obrigatório');
  });

  it('should manage roles correctly', () => {
    const pessoa = PessoaEntity.create({
      ...baseProps,
      roles: ['CLIENT'],
    });

    expect(pessoa.hasRole('CLIENT')).toBe(true);
    expect(pessoa.hasRole('FORNECEDOR')).toBe(false);

    pessoa.addRole('FORNECEDOR');
    expect(pessoa.hasRole('FORNECEDOR')).toBe(true);
    expect(pessoa.roles).toContain('CLIENT');
    expect(pessoa.roles).toContain('FORNECEDOR');

    pessoa.removeRole('CLIENT');
    expect(pessoa.hasRole('CLIENT')).toBe(false);

    pessoa.assignRoles(['FUNCIONARIO']);
    expect(pessoa.roles).toEqual(['FUNCIONARIO']);
  });

  it('should update details and sanitize fields', () => {
    const pessoa = PessoaEntity.create(baseProps);

    pessoa.updateDetails({
      name: 'João Silva Santos',
      cep: '12.345-678',
      uf: 'sp',
      cnpj: '12.345.678/0001-90',
    });

    expect(pessoa.name).toBe('João Silva Santos');
    expect(pessoa.cep).toBe('12345678');
    expect(pessoa.uf).toBe('SP');
    expect(pessoa.cnpj).toBe('12345678000190');
  });
});
