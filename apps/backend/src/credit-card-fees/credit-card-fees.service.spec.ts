import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardFeesService } from './credit-card-fees.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CreditCardFeesService', () => {
  let service: CreditCardFeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditCardFeesService,
        { provide: PrismaService, useValue: { creditCardFee: { findMany: jest.fn(), create: jest.fn(), findFirstOrThrow: jest.fn(), delete: jest.fn() } } },
      ],
    }).compile();

    service = module.get<CreditCardFeesService>(CreditCardFeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
