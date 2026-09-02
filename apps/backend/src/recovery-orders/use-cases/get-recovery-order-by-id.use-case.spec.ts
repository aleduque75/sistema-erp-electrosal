import { GetRecoveryOrderByIdUseCase } from './get-recovery-order-by-id.use-case';
import { IRecoveryOrderRepository } from '@sistema-erp-electrosal/core';
import { NotFoundException } from '@nestjs/common';

describe('GetRecoveryOrderByIdUseCase', () => {
  let useCase: GetRecoveryOrderByIdUseCase;
  let mockRepository: jest.Mocked<IRecoveryOrderRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByOrderNumber: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new GetRecoveryOrderByIdUseCase(mockRepository);
  });

  it('should return recovery order when found', async () => {
    mockRepository.findById.mockResolvedValue({ id: 'ro-1' } as any);

    const result = await useCase.execute('ro-1', 'org-1');
    expect(result).toEqual({ id: 'ro-1' });
    expect(mockRepository.findById).toHaveBeenCalledWith('ro-1', 'org-1');
  });

  it('should throw NotFoundException when not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ro-999', 'org-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
