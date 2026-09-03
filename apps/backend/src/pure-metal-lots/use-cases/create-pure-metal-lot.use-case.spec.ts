import { CreatePureMetalLotUseCase } from './create-pure-metal-lot.use-case';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { EntityCounterService } from '../../common/services/entity-counter.service';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';
import { TipoMetal } from '@prisma/client';

describe('CreatePureMetalLotUseCase', () => {
  let useCase: CreatePureMetalLotUseCase;
  let mockRepository: jest.Mocked<PureMetalLotsRepository>;
  let mockEntityCounter: jest.Mocked<EntityCounterService>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findRecoveryOrderOrigin: jest.fn(),
      findMetalCreditOrigin: jest.fn(),
      findManyMovementsByPureMetalLotId: jest.fn(),
      executeInTransaction: jest.fn().mockImplementation((cb) => cb({
        pureMetalLotMovement: { create: jest.fn().mockResolvedValue({}) },
        pessoa: { findUnique: jest.fn() },
        metalAccount: { findFirst: jest.fn(), create: jest.fn() },
        metalAccountEntry: { create: jest.fn() },
        metalCredit: { create: jest.fn() },
      })),
    } as any;

    mockEntityCounter = {
      getNextNumber: jest.fn().mockResolvedValue(101),
    } as any;

    useCase = new CreatePureMetalLotUseCase(mockRepository, mockEntityCounter);
  });

  it('should create pure metal lot and initial movement', async () => {
    mockRepository.create.mockImplementation(async (entity) => {
      return PureMetalLotEntity.create({
        id: 'lot-101',
        organizationId: entity.organizationId,
        sourceType: entity.sourceType,
        sourceId: entity.sourceId,
        metalType: entity.metalType,
        initialGrams: entity.initialGrams,
        remainingGrams: entity.remainingGrams,
        lotNumber: entity.lotNumber,
      });
    });

    const result = await useCase.execute('org-1', {
      sourceType: 'RECOVERY_ORDER',
      sourceId: 'ro-1',
      metalType: TipoMetal.AU,
      initialGrams: 100,
    } as any);

    expect(result.id).toBe('lot-101');
    expect(result.lotNumber).toBe('LMP-000101');
    expect(mockRepository.create).toHaveBeenCalled();
  });
});
