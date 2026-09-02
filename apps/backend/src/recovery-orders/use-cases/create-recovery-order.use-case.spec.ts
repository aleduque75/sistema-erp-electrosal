import { CreateRecoveryOrderUseCase } from './create-recovery-order.use-case';
import { IRecoveryOrderRepository, IAnaliseQuimicaRepository, TipoMetal } from '@sistema-erp-electrosal/core';
import { GenerateNextNumberUseCase } from '../../common/use-cases/generate-next-number.use-case';
import { AddRawMaterialToRecoveryOrderUseCase } from './add-raw-material.use-case';
import { PrismaService } from '../../prisma/prisma.service';

describe('CreateRecoveryOrderUseCase', () => {
  let useCase: CreateRecoveryOrderUseCase;
  let mockRecoveryOrderRepository: jest.Mocked<IRecoveryOrderRepository>;
  let mockAnaliseRepository: jest.Mocked<IAnaliseQuimicaRepository>;
  let mockGenerateNextNumberUseCase: jest.Mocked<GenerateNextNumberUseCase>;
  let mockAddRawMaterialUseCase: jest.Mocked<AddRawMaterialToRecoveryOrderUseCase>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRecoveryOrderRepository = {
      create: jest.fn().mockImplementation((ro) => Promise.resolve(ro)),
      save: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      findAll: jest.fn(),
    };

    mockAnaliseRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findResidueAnalyses: jest.fn(),
    };

    mockGenerateNextNumberUseCase = {
      execute: jest.fn().mockResolvedValue('REC-2026-0001'),
    } as any;

    mockAddRawMaterialUseCase = {
      execute: jest.fn(),
    } as any;

    mockPrisma = {
      $transaction: jest.fn().mockImplementation((fn) => fn(mockPrisma)),
    };

    useCase = new CreateRecoveryOrderUseCase(
      mockRecoveryOrderRepository,
      mockAnaliseRepository,
      mockGenerateNextNumberUseCase,
      mockAddRawMaterialUseCase,
      mockPrisma,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});
