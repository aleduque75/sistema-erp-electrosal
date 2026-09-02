import { PayClientWithMetalUseCase } from './pay-client-with-metal.use-case';
import { MetalPaymentRepository } from '../repositories/metal-payment.repository';
import { CreateTransacaoUseCase } from '../../transacoes/use-cases/create-transacao.use-case';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TipoMetal } from '@prisma/client';
import Decimal from 'decimal.js';

describe('PayClientWithMetalUseCase', () => {
  let useCase: PayClientWithMetalUseCase;
  let mockRepository: jest.Mocked<MetalPaymentRepository>;
  let mockCreateTransacaoUseCase: jest.Mocked<CreateTransacaoUseCase>;
  let mockQuotationsService: jest.Mocked<QuotationsService>;
  let mockSettingsService: jest.Mocked<SettingsService>;

  beforeEach(() => {
    mockRepository = {
      findPureMetalLot: jest.fn(),
      createLotMovement: jest.fn().mockResolvedValue({ id: 'mov-1' }),
      findOpenMetalCredits: jest.fn().mockResolvedValue([]),
      updateMetalCredit: jest.fn().mockResolvedValue(undefined),
      findOrCreateMetalAccount: jest.fn().mockResolvedValue({
        id: 'acc-1',
        organizationId: 'org-1',
        personId: 'cli-1',
        type: TipoMetal.AU,
      }),
      createMetalAccountEntry: jest.fn().mockResolvedValue(undefined),
      executeInTransaction: jest.fn().mockImplementation((fn) => fn({})),
    };

    mockCreateTransacaoUseCase = {
      execute: jest.fn().mockResolvedValue({} as any),
    } as any;

    mockQuotationsService = {
      findLatest: jest.fn(),
    } as any;

    mockSettingsService = {
      findOne: jest.fn(),
    } as any;

    useCase = new PayClientWithMetalUseCase(
      mockRepository,
      mockCreateTransacaoUseCase,
      mockQuotationsService,
      mockSettingsService,
    );
  });

  it('should throw NotFoundException if pure metal lot is not found', async () => {
    mockRepository.findPureMetalLot.mockResolvedValue(null);

    await expect(
      useCase.execute('org-1', 'user-1', {
        clientId: 'cli-1',
        pureMetalLotId: 'lot-not-found',
        grams: 10,
        data: '2026-09-02',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if lot has insufficient grams', async () => {
    mockRepository.findPureMetalLot.mockResolvedValue({
      id: 'lot-1',
      remainingGrams: 5,
      metalType: TipoMetal.AU,
    });

    mockQuotationsService.findLatest.mockResolvedValue({
      buyPrice: new Decimal(350),
    } as any);

    await expect(
      useCase.execute('org-1', 'user-1', {
        clientId: 'cli-1',
        pureMetalLotId: 'lot-1',
        grams: 10,
        data: '2026-09-02',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should pay client with metal successfully and return response DTO', async () => {
    mockRepository.findPureMetalLot.mockResolvedValue({
      id: 'lot-1',
      remainingGrams: 50,
      metalType: TipoMetal.AU,
      lotNumber: 'LOT-2026-01',
    });

    mockQuotationsService.findLatest.mockResolvedValue({
      buyPrice: new Decimal(350),
    } as any);

    mockSettingsService.findOne.mockResolvedValue({
      productionCostAccountId: 'acc-prod-1',
      metalStockAccountId: 'acc-stock-1',
    } as any);

    const result = await useCase.execute('org-1', 'user-1', {
      clientId: 'cli-1',
      pureMetalLotId: 'lot-1',
      grams: 10,
      data: '2026-09-02',
    });

    expect(result.message).toContain('sucesso');
    expect(result.clientId).toBe('cli-1');
    expect(result.grams).toBe(10);
    expect(result.valorBRL).toBe(3500);
    expect(mockCreateTransacaoUseCase.execute).toHaveBeenCalledTimes(2);
    expect(mockRepository.createLotMovement).toHaveBeenCalled();
  });
});
