import { CreatePessoaUseCase } from './create-pessoa.use-case';
import { PessoaRepository } from '../repositories/pessoa.repository';
import { PessoaType } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { PessoaEntity } from '../entities/pessoa.entity';

describe('CreatePessoaUseCase', () => {
  let useCase: CreatePessoaUseCase;
  let mockRepository: jest.Mocked<PessoaRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCpf: jest.fn(),
      findByCnpj: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      hasSalesHistory: jest.fn(),
      hasPurchaseOrdersHistory: jest.fn(),
      hasFinancialTransactions: jest.fn(),
    } as any;

    useCase = new CreatePessoaUseCase(mockRepository);
  });

  it('should throw ConflictException if CPF already exists', async () => {
    mockRepository.findByCpf.mockResolvedValue(
      PessoaEntity.create({
        organizationId: 'org-1',
        name: 'Maria',
        type: PessoaType.FISICA,
      }),
    );

    await expect(
      useCase.execute('org-1', {
        name: 'Joao',
        type: PessoaType.FISICA,
        cpf: '12345678900',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should successfully create a pessoa entity', async () => {
    mockRepository.findByCpf.mockResolvedValue(null);
    mockRepository.create.mockImplementation(async (entity) => {
      return PessoaEntity.create({
        id: 'p-new',
        organizationId: entity.organizationId,
        name: entity.name,
        type: entity.type,
        roles: entity.roles,
      });
    });

    const result = await useCase.execute('org-1', {
      name: 'Joao Silva',
      type: PessoaType.FISICA,
      roles: ['CLIENT'],
    });

    expect(result.id).toBe('p-new');
    expect(result.name).toBe('Joao Silva');
    expect(result.roles).toContain('CLIENT');
  });
});
