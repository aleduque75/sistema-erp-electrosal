import { CreateAccountRecUseCase } from './create-account-rec.use-case';
import { AccountsRecRepository } from '../repositories/account-rec.repository';
import { AccountRecEntity } from '../entities/account-rec.entity';

describe('CreateAccountRecUseCase', () => {
  let useCase: CreateAccountRecUseCase;
  let mockRepo: jest.Mocked<AccountsRecRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockImplementation(async (entity: AccountRecEntity) => {
        return AccountRecEntity.create({
          id: 'rec-created',
          organizationId: entity.organizationId,
          description: entity.description,
          amount: entity.amount,
          dueDate: entity.dueDate,
        });
      }),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      executeInTransaction: jest.fn(),
    };

    useCase = new CreateAccountRecUseCase(mockRepo);
  });

  it('should create an account rec successfully', async () => {
    const result = await useCase.execute('org-1', {
      description: 'Venda Teste',
      amount: 800,
      dueDate: '2026-07-01',
    });

    expect(result.id).toBe('rec-created');
    expect(result.description).toBe('Venda Teste');
    expect(result.amount).toBe(800);
  });
});
