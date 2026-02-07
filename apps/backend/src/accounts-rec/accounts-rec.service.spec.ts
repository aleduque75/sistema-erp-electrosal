import { Test, TestingModule } from '@nestjs/testing';
import { AccountsRecService } from './accounts-rec.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { QuotationsService } from '../quotations/quotations.service';
import { CalculateSaleAdjustmentUseCase } from '../sales/use-cases/calculate-sale-adjustment.use-case';

describe('AccountsRecService', () => {
  let service: AccountsRecService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsRecService,
        { provide: PrismaService, useValue: { accountRec: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() }, $transaction: jest.fn() } },
        { provide: SettingsService, useValue: { findOne: jest.fn() } },
        { provide: QuotationsService, useValue: { findByDate: jest.fn() } },
        { provide: CalculateSaleAdjustmentUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    service = module.get<AccountsRecService>(AccountsRecService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
