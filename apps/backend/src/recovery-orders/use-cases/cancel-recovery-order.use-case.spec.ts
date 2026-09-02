import { CancelRecoveryOrderUseCase } from './cancel-recovery-order.use-case';
import { IRecoveryOrderRepository, IAnaliseQuimicaRepository } from '@sistema-erp-electrosal/core';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RecoveryOrderStatus } from '@sistema-erp-electrosal/core/domain/enums/recovery-order-status.enum';

describe('CancelRecoveryOrderUseCase', () => {
  let useCase: CancelRecoveryOrderUseCase;
  let mockRecoveryOrderRepository: jest.Mocked<IRecoveryOrderRepository>;
  let mockAnaliseQuimicaRepository: jest.Mocked<IAnaliseQuimicaRepository>;

  beforeEach(() => {
    mockRecoveryOrderRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findByOrderNumber: jest.fn(),
      create: jest.fn(),
    };

    mockAnaliseQuimicaRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findResidueAnalyses: jest.fn(),
    };

    useCase = new CancelRecoveryOrderUseCase(
      mockRecoveryOrderRepository,
      mockAnaliseQuimicaRepository,
    );
  });

  it('should throw NotFoundException when order is not found', async () => {
    mockRecoveryOrderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ recoveryOrderId: 'ro-404', organizationId: 'org-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException when order is already finalized', async () => {
    mockRecoveryOrderRepository.findById.mockResolvedValue({
      id: 'ro-1',
      status: RecoveryOrderStatus.FINALIZADA,
    } as any);

    await expect(
      useCase.execute({ recoveryOrderId: 'ro-1', organizationId: 'org-1' }),
    ).rejects.toThrow(ConflictException);
  });
});
