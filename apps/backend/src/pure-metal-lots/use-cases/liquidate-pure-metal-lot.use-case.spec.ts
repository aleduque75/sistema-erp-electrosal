import { LiquidatePureMetalLotUseCase } from './liquidate-pure-metal-lot.use-case';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';
import { TipoMetal, PureMetalLotStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('LiquidatePureMetalLotUseCase', () => {
  let useCase: LiquidatePureMetalLotUseCase;
  let mockRepository: jest.Mocked<PureMetalLotsRepository>;
  let mockTx: any;

  beforeEach(() => {
    mockTx = {};

    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn().mockImplementation((lot) => Promise.resolve(lot)),
      remove: jest.fn(),
      findRecoveryOrderOrigin: jest.fn(),
      findMetalCreditOrigin: jest.fn(),
      findManyMovementsByPureMetalLotId: jest.fn(),
      createMovement: jest.fn().mockResolvedValue({}),
      executeInTransaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
    } as any;

    useCase = new LiquidatePureMetalLotUseCase(mockRepository);
  });

  it('should throw NotFoundException if lot does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should liquidate lot with remaining grams and create exit movement', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'src-1',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      remainingGrams: 0.05,
    });

    mockRepository.findById.mockResolvedValue({
      lot,
    });

    const result = await useCase.execute('org-1', 'lot-1', { notes: 'Ajuste de perda' });

    expect(mockRepository.createMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        pureMetalLotId: 'lot-1',
        type: 'EXIT',
        grams: 0.05,
        notes: 'Ajuste de perda',
      }),
      mockTx,
    );

    expect(result.remainingGrams).toBe(0);
    expect(result.status).toBe(PureMetalLotStatus.USED);
    expect(mockRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        remainingGrams: expect.objectContaining({ value: 0 }),
      }),
      mockTx,
    );
  });

  it('should liquidate already zeroed lot without creating exit movement', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-zero',
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'src-1',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      remainingGrams: 0,
    });

    mockRepository.findById.mockResolvedValue({
      lot,
    });

    const result = await useCase.execute('org-1', 'lot-zero');

    expect(mockRepository.createMovement).not.toHaveBeenCalled();
    expect(result.remainingGrams).toBe(0);
    expect(result.status).toBe(PureMetalLotStatus.USED);
  });
});
