import { CreateAccountPayUseCase } from './create-account-pay.use-case';
import { AccountsPayRepository } from '../repositories/account-pay.repository';
import { AccountPayEntity } from '../entities/account-pay.entity';

describe('CreateAccountPayUseCase', () => {
  let useCase: CreateAccountPayUseCase;
  let mockRepo: jest.Mocked<AccountsPayRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockImplementation(async (entity: AccountPayEntity) => {
        return AccountPayEntity.create({
          id: 'created-id',
          organizationId: entity.organizationId,
          description: entity.description,
          amount: entity.amount,
          dueDate: entity.dueDate,
        });
      }),
      createMany: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getSummaryByCategory: jest.fn(),
      executeInTransaction: jest.fn(),
    };

    mockPrisma = {
      fornecedor: { findFirst: jest.fn().mockResolvedValue({ id: 'forn-1' }) },
      contaContabil: { findFirst: jest.fn().mockResolvedValue({ id: 'cc-1' }) },
    };

    useCase = new CreateAccountPayUseCase(mockRepo, mockPrisma);
  });

  it('should create an account pay successfully', async () => {
    const result = await useCase.execute('org-1', {
      description: 'Conta Teste',
      amount: 500,
      dueDate: new Date('2026-06-01'),
      fornecedorId: 'forn-1',
    });

    expect(result.id).toBe('created-id');
    expect(result.description).toBe('Conta Teste');
    expect(result.amount).toBe(500);
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
