import { ListRecoveryOrdersUseCase } from './list-recovery-orders.use-case';
import { IRecoveryOrderRepository } from '@sistema-erp-electrosal/core';

describe('ListRecoveryOrdersUseCase', () => {
  let useCase: ListRecoveryOrdersUseCase;
  let mockRepository: jest.Mocked<IRecoveryOrderRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn().mockResolvedValue([{ id: 'ro-1' }]),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new ListRecoveryOrdersUseCase(mockRepository);
  });

  it('should list recovery orders matching filters', async () => {
    const result = await useCase.execute('org-1', { status: 'PENDENTE' } as any);
    expect(mockRepository.findAll).toHaveBeenCalledWith('org-1', { status: 'PENDENTE' });
    expect(result).toHaveLength(1);
  });
});
