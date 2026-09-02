import { DeletePessoaUseCase } from './delete-pessoa.use-case';
import { PessoaRepository } from '../repositories/pessoa.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PessoaEntity } from '../entities/pessoa.entity';
import { PessoaType } from '@prisma/client';

describe('DeletePessoaUseCase', () => {
  let useCase: DeletePessoaUseCase;
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

    useCase = new DeletePessoaUseCase(mockRepository);
  });

  it('should throw NotFoundException if pessoa not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'p-999')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ConflictException if pessoa has sales history', async () => {
    mockRepository.findById.mockResolvedValue(
      PessoaEntity.create({
        id: 'p-1',
        organizationId: 'org-1',
        name: 'Cliente com Venda',
        type: PessoaType.FISICA,
      }),
    );
    mockRepository.hasSalesHistory.mockResolvedValue(true);

    await expect(useCase.execute('org-1', 'p-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should successfully delete pessoa when there are no constraints', async () => {
    mockRepository.findById.mockResolvedValue(
      PessoaEntity.create({
        id: 'p-1',
        organizationId: 'org-1',
        name: 'Cliente Sem Vendas',
        type: PessoaType.FISICA,
      }),
    );
    mockRepository.hasSalesHistory.mockResolvedValue(false);
    mockRepository.hasPurchaseOrdersHistory.mockResolvedValue(false);
    mockRepository.hasFinancialTransactions.mockResolvedValue(false);

    const result = await useCase.execute('org-1', 'p-1');
    expect(mockRepository.delete).toHaveBeenCalledWith('p-1', 'org-1');
    expect(result.message).toContain('sucesso');
  });
});
