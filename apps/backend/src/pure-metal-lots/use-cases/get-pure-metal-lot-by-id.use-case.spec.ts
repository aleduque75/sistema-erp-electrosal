import { GetPureMetalLotByIdUseCase } from './get-pure-metal-lot-by-id.use-case';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';
import { NotFoundException } from '@nestjs/common';
import { TipoMetal } from '@prisma/client';

describe('GetPureMetalLotByIdUseCase', () => {
  let useCase: GetPureMetalLotByIdUseCase;
  let mockRepository: jest.Mocked<PureMetalLotsRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findRecoveryOrderOrigin: jest.fn(),
      findMetalCreditOrigin: jest.fn(),
    } as any;

    useCase = new GetPureMetalLotByIdUseCase(mockRepository);
  });

  it('should throw NotFoundException when lot does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('org-1', 'invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should return mapped lot with origin details when found', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'RECOVERY_ORDER',
      sourceId: 'ro-1',
      metalType: TipoMetal.AU,
      initialGrams: 50,
    });

    mockRepository.findById.mockResolvedValue({
      lot,
      sale: null,
      chemicalReactions: [],
    });
    mockRepository.findRecoveryOrderOrigin.mockResolvedValue({
      orderNumber: 'RO-100',
      observacoes: 'Recuperação ouro fino',
    });

    const result = await useCase.execute('org-1', 'lot-1');
    expect(result.id).toBe('lot-1');
    expect(result.originDetails.orderNumber).toBe('RO-100');
    expect(result.originDetails.name).toBe('Recuperação ouro fino');
  });
});
