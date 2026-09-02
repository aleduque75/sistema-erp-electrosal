import { PessoaMapper, PrismaPessoaWithRoles } from './pessoa.mapper';
import { PessoaType } from '@prisma/client';

describe('PessoaMapper', () => {
  const mockPrismaPessoa: PrismaPessoaWithRoles = {
    id: 'p-1',
    organizationId: 'org-1',
    name: 'Empresa Modelo LTDA',
    type: PessoaType.JURIDICA,
    razaoSocial: 'Empresa Modelo Razao',
    cnpj: '12345678000190',
    cpf: null,
    email: 'contato@modelo.com',
    phone: '1199999999',
    birthDate: null,
    gender: null,
    cep: '01001000',
    logradouro: 'Praça da Sé',
    numero: '100',
    complemento: 'Sala 1',
    bairro: 'Sé',
    cidade: 'São Paulo',
    uf: 'SP',
    externalId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    client: {
      pessoaId: 'p-1',
      organizationId: 'org-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    fornecedor: {
      pessoaId: 'p-1',
      organizationId: 'org-1',
      defaultContaContabilId: 'conta-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    funcionario: null,
  };

  it('should convert raw Prisma data to Domain Entity', () => {
    const entity = PessoaMapper.toDomain(mockPrismaPessoa);

    expect(entity.id).toBe('p-1');
    expect(entity.organizationId).toBe('org-1');
    expect(entity.name).toBe('Empresa Modelo LTDA');
    expect(entity.isJuridica()).toBe(true);
    expect(entity.cnpj).toBe('12345678000190');
    expect(entity.hasRole('CLIENT')).toBe(true);
    expect(entity.hasRole('FORNECEDOR')).toBe(true);
    expect(entity.hasRole('FUNCIONARIO')).toBe(false);
    expect(entity.defaultContaContabilId).toBe('conta-123');
  });

  it('should convert Domain Entity to API Response DTO preserving relations structure', () => {
    const entity = PessoaMapper.toDomain(mockPrismaPessoa);
    const dto = PessoaMapper.toResponseDto(entity);

    expect(dto.id).toBe('p-1');
    expect(dto.name).toBe('Empresa Modelo LTDA');
    expect(dto.roles).toEqual(expect.arrayContaining(['CLIENT', 'FORNECEDOR']));
    expect(dto.client).toEqual({ pessoaId: 'p-1', organizationId: 'org-1' });
    expect(dto.fornecedor).toEqual({
      pessoaId: 'p-1',
      organizationId: 'org-1',
      defaultContaContabilId: 'conta-123',
    });
    expect(dto.funcionario).toBeNull();
  });
});
