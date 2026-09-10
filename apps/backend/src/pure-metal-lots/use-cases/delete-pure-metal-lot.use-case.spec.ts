import { DeletePureMetalLotUseCase } from './delete-pure-metal-lot.use-case';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';
import { TipoMetal } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DeletePureMetalLotUseCase', () => {
  let useCase: DeletePureMetalLotUseCase;
  let mockRepository: jest.Mocked<PureMetalLotsRepository>;
  let mockTx: any;

  beforeEach(() => {
    mockTx = {
      transacao: {
        findUnique: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      findRecoveryOrderOrigin: jest.fn(),
      findMetalCreditOrigin: jest.fn(),
      findManyMovementsByPureMetalLotId: jest.fn(),
      executeInTransaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
    } as any;

    useCase = new DeletePureMetalLotUseCase(mockRepository);
  });

  it('should throw NotFoundException if lot is not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'lot-none')).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if lot has chemical reactions', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'src-1',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      remainingGrams: 100,
    });

    mockRepository.findById.mockResolvedValue({
      lot,
      chemicalReactions: [{ id: 'cr-1' }],
    });

    await expect(useCase.execute('org-1', 'lot-1')).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if lot has been consumed', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'src-1',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      remainingGrams: 80,
    });

    mockRepository.findById.mockResolvedValue({
      lot,
      chemicalReactions: [],
    });

    await expect(useCase.execute('org-1', 'lot-1')).rejects.toThrow(BadRequestException);
  });

  it('should successfully delete an available lot', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'SUPPLIER_ACCOUNT_TRANSFER',
      sourceId: 'tx-123',
      metalType: TipoMetal.AG,
      initialGrams: 500,
      remainingGrams: 500,
    });

    mockRepository.findById.mockResolvedValue({
      lot,
      chemicalReactions: [],
    });

    mockTx.transacao.findUnique.mockResolvedValue({
      id: 'tx-123',
      linkedTransactionId: 'tx-456',
    });

    const result = await useCase.execute('org-1', 'lot-1');

    expect(result).toEqual({ success: true });
    expect(mockTx.transacao.deleteMany).toHaveBeenCalledWith({
      where: { id: 'tx-456', organizationId: 'org-1' },
    });
    expect(mockTx.transacao.delete).toHaveBeenCalledWith({
      where: { id: 'tx-123', organizationId: 'org-1' },
    });
    expect(mockRepository.remove).toHaveBeenCalledWith('lot-1', 'org-1', mockTx);
  });
});
