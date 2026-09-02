import { PayClientWithMetalUseCase } from './pay-client-with-metal.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { PureMetalLotsService } from '../../pure-metal-lots/pure-metal-lots.service';
import { CreateTransacaoUseCase } from '../../transacoes/use-cases/create-transacao.use-case';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Decimal } from 'decimal.js';

describe('PayClientWithMetalUseCase', () => {
  let useCase: PayClientWithMetalUseCase;
  let mockPrisma: any;
  let mockPureMetalLotsService: jest.Mocked<PureMetalLotsService>;
  let mockCreateTransacaoUseCase: jest.Mocked<CreateTransacaoUseCase>;
  let mockQuotationsService: jest.Mocked<QuotationsService>;
  let mockSettingsService: jest.Mocked<SettingsService>;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
      metalCredit: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
      metalAccount: {
        findUnique: jest.fn().mockResolvedValue({ id: 'metal-acc-1' }),
        create: jest.fn().mockResolvedValue({ id: 'metal-acc-1' }),
      },
      metalAccountEntry: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    mockPureMetalLotsService = {
      findOne: jest.fn(),
      createPureMetalLotMovement: jest.fn().mockResolvedValue({ id: 'mov-1' }),
    } as any;

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
      mockPrisma,
      mockPureMetalLotsService,
      mockCreateTransacaoUseCase,
      mockQuotationsService,
      mockSettingsService,
    );
  });

  it('should throw NotFoundException if pure metal lot is not found', async () => {
    mockPureMetalLotsService.findOne.mockResolvedValue(null);

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
    mockPureMetalLotsService.findOne.mockResolvedValue({
      id: 'lot-1',
      remainingGrams: 5,
      metalType: 'AU',
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

  it('should pay client with metal successfully', async () => {
    mockPureMetalLotsService.findOne.mockResolvedValue({
      id: 'lot-1',
      remainingGrams: 50,
      metalType: 'AU',
    } as any);

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

    expect(result.message).toBe('Pagamento em metal ao cliente registrado com sucesso.');
    expect(mockCreateTransacaoUseCase.execute).toHaveBeenCalledTimes(2);
    expect(mockPureMetalLotsService.createPureMetalLotMovement).toHaveBeenCalled();
  });
});
