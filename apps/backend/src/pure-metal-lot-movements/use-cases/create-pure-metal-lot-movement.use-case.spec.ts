import { CreatePureMetalLotMovementUseCase } from './create-pure-metal-lot-movement.use-case';
import { PureMetalLotMovementsRepository } from '../repositories/pure-metal-lot-movement.repository';
import { PureMetalLotsRepository } from '../../pure-metal-lots/repositories/pure-metal-lot.repository';
import { PureMetalLotEntity } from '../../pure-metal-lots/entities/pure-metal-lot.entity';
import { PureMetalLotMovementEntity } from '../entities/pure-metal-lot-movement.entity';
import { TipoMetal, PureMetalLotMovementType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('CreatePureMetalLotMovementUseCase', () => {
  let useCase: CreatePureMetalLotMovementUseCase;
  let mockMovementsRepo: jest.Mocked<PureMetalLotMovementsRepository>;
  let mockLotsRepo: jest.Mocked<PureMetalLotsRepository>;

  beforeEach(() => {
    mockMovementsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      executeInTransaction: jest.fn().mockImplementation((cb) => cb({})),
    } as any;

    mockLotsRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    useCase = new CreatePureMetalLotMovementUseCase(mockMovementsRepo, mockLotsRepo);
  });

  it('should throw NotFoundException if lot does not exist', async () => {
    mockLotsRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        pureMetalLotId: 'invalid-lot',
        grams: 10,
        type: PureMetalLotMovementType.ENTRY,
      }, 'org-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should create movement and update lot balance', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      remainingGrams: 50,
    });

    mockLotsRepo.findById.mockResolvedValue({ lot, sale: null, chemicalReactions: [] });
    mockMovementsRepo.create.mockImplementation(async (entity) => {
      return PureMetalLotMovementEntity.create({
        id: 'mov-1',
        organizationId: entity.organizationId,
        pureMetalLotId: entity.pureMetalLotId,
        type: entity.type.value,
        grams: entity.gramsNumber,
        notes: entity.notes,
      });
    });

    const result = await useCase.execute({
      pureMetalLotId: 'lot-1',
      grams: 20,
      type: PureMetalLotMovementType.ENTRY,
    }, 'org-1');

    expect(result.id).toBe('mov-1');
    expect(lot.remainingGrams.value).toBe(70);
    expect(mockLotsRepo.update).toHaveBeenCalledWith(lot, expect.anything());
    expect(mockMovementsRepo.create).toHaveBeenCalled();
  });
});
