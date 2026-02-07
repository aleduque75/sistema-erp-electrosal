import { Test, TestingModule } from '@nestjs/testing';
import { AccountsRecController } from './accounts-rec.controller';
import { AccountsRecService } from './accounts-rec.service';
import { PayAccountsRecWithMetalCreditUseCase } from './use-cases/pay-accounts-rec-with-metal-credit.use-case';
import { PayAccountsRecWithMetalUseCase } from './use-cases/pay-accounts-rec-with-metal.use-case';
import { PayAccountsRecWithMetalCreditMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-credit-multiple.use-case';
import { PayAccountsRecWithMetalMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-multiple.use-case';
import { HybridReceiveUseCase } from './use-cases/hybrid-receive.use-case';

describe('AccountsRecController', () => {
  let controller: AccountsRecController;
  let service: AccountsRecService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsRecController],
      providers: [
        {
          provide: AccountsRecService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            receive: jest.fn(),
            forceFinalize: jest.fn(),
          },
        },
        { provide: PayAccountsRecWithMetalCreditUseCase, useValue: { execute: jest.fn() } },
        { provide: PayAccountsRecWithMetalUseCase, useValue: { execute: jest.fn() } },
        { provide: PayAccountsRecWithMetalCreditMultipleUseCase, useValue: { execute: jest.fn() } },
        { provide: PayAccountsRecWithMetalMultipleUseCase, useValue: { execute: jest.fn() } },
        { provide: HybridReceiveUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AccountsRecController>(AccountsRecController);
    service = module.get<AccountsRecService>(AccountsRecService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
