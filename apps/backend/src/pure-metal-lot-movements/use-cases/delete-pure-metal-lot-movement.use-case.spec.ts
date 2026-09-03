import { DeletePureMetalLotMovementUseCase } from './delete-pure-metal-lot-movement.use-case';
import { PureMetalLotMovementsRepository } from '../repositories/pure-metal-lot-movement.repository';
import { PureMetalLotsRepository } from '../../pure-metal-lots/repositories/pure-metal-lot.repository';
import { PureMetalLotEntity } from '../../pure-metal-lots/entities/pure-metal-lot.entity';
import { PureMetalLotMovementEntity } from '../entities/pure-metal-lot-movement.entity';
import { TipoMetal, PureMetalLotMovementType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('DeletePureMetalLotMovementUseCase', () => {
  let useCase: DeletePureMetalLotMovementUseCase;
  let mockMovementsRepo: jest.Mocked<PureMetalLotMovementsRepository>;
  let mockLotsRepo: jest.Mocked<PureMetalLotsRepository>;

  beforeEach(() => {
    mockMovementsRepo = {
      findById: jest.fn(),
      remove: jest.fn(),
      executeInTransaction: jest.fn().mockImplementation((cb) => cb({})),
    } as any;

    mockLotsRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    useCase = new DeletePureMetalLotMovementUseCase(mockMovementsRepo, mockLotsRepo);
  });

  it('should throw NotFoundException if movement does not exist', async () => {
    mockMovementsRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('mov-1', 'org-1')).rejects.toThrow(NotFoundException);
  });

  it('should revert movement effect on lot and delete movement', async () => {
    const mov = PureMetalLotMovementEntity.create({
      id: 'mov-1',
      organizationId: 'org-1',
      pureMetalLotId: 'lot-1',
      type: PureMetalLotMovementType.ENTRY,
      grams: 30,
    });

    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      remainingGrams: 80,
    });

    mockMovementsRepo.findById.mockResolvedValue(mov);
    mockLotsRepo.findById.mockResolvedValue({ lot, sale: null, chemicalReactions: [] });

    const result = await useCase.execute('mov-1', 'org-1');
    expect(result.success).toBe(true);
    expect(lot.remainingGrams.value).toBe(50);
    expect(mockLotsRepo.update).toHaveBeenCalledWith(lot, expect.anything());
    expect(mockMovementsRepo.remove).toHaveBeenCalledWith('mov-1', 'org-1', expect.anything());
  });
});
