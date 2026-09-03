import { SellPureMetalLotUseCase } from './sell-pure-metal-lot.use-case';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TipoMetal, PureMetalLotStatus } from '@prisma/client';

describe('SellPureMetalLotUseCase', () => {
  let useCase: SellPureMetalLotUseCase;
  let mockRepository: jest.Mocked<PureMetalLotsRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      executeInTransaction: jest.fn().mockImplementation((cb) => cb({
        sale: { findFirst: jest.fn().mockResolvedValue({ orderNumber: 31700 }), create: jest.fn().mockResolvedValue({ id: 'sale-1', orderNumber: 31701 }) },
        product: { findFirst: jest.fn().mockResolvedValue({ id: 'prod-1' }), create: jest.fn() },
        saleItem: { create: jest.fn().mockResolvedValue({}) },
        accountRec: { create: jest.fn().mockResolvedValue({}) },
        pureMetalLotMovement: { create: jest.fn().mockResolvedValue({}) },
      })),
    } as any;

    useCase = new SellPureMetalLotUseCase(mockRepository);
  });

  it('should throw NotFoundException if lot is not found', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('org-1', 'user-1', 'lot-1', {
        clientId: 'client-1',
        grams: 50,
        totalAmount: 15000,
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if lot has insufficient grams', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 30,
      remainingGrams: 20,
    });

    mockRepository.findById.mockResolvedValue({ lot, sale: null, chemicalReactions: [] });

    await expect(
      useCase.execute('org-1', 'user-1', 'lot-1', {
        clientId: 'client-1',
        grams: 50,
        totalAmount: 15000,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should sell pure metal lot successfully and update balance', async () => {
    const lot = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      remainingGrams: 100,
    });

    mockRepository.findById.mockResolvedValue({ lot, sale: null, chemicalReactions: [] });
    mockRepository.update.mockImplementation(async (entity) => entity);

    const result = await useCase.execute('org-1', 'user-1', 'lot-1', {
      clientId: 'client-1',
      grams: 40,
      totalAmount: 16000,
    } as any);

    expect(result.remainingGrams).toBe(60);
    expect(result.status).toBe(PureMetalLotStatus.PARTIALLY_USED);
    expect(mockRepository.update).toHaveBeenCalled();
  });
});
