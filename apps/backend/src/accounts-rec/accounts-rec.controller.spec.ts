import { Test, TestingModule } from '@nestjs/testing';
import { AccountsRecController } from './accounts-rec.controller';
import { CreateAccountRecUseCase } from './use-cases/create-account-rec.use-case';
import { ListAccountsRecUseCase } from './use-cases/list-accounts-rec.use-case';
import { GetAccountRecByIdUseCase } from './use-cases/get-account-rec-by-id.use-case';
import { UpdateAccountRecUseCase } from './use-cases/update-account-rec.use-case';
import { DeleteAccountRecUseCase } from './use-cases/delete-account-rec.use-case';
import { ReceiveAccountRecPaymentUseCase } from './use-cases/receive-account-rec-payment.use-case';
import { ForceFinalizeAccountRecUseCase } from './use-cases/force-finalize-account-rec.use-case';
import { PayAccountsRecWithMetalCreditUseCase } from './use-cases/pay-accounts-rec-with-metal-credit.use-case';
import { PayAccountsRecWithMetalUseCase } from './use-cases/pay-accounts-rec-with-metal.use-case';
import { PayAccountsRecWithMetalCreditMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-credit-multiple.use-case';
import { PayAccountsRecWithMetalMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-multiple.use-case';
import { HybridReceiveUseCase } from './use-cases/hybrid-receive.use-case';

describe('AccountsRecController', () => {
  let controller: AccountsRecController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsRecController],
      providers: [
        { provide: CreateAccountRecUseCase, useValue: { execute: jest.fn() } },
        { provide: ListAccountsRecUseCase, useValue: { execute: jest.fn() } },
        { provide: GetAccountRecByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateAccountRecUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteAccountRecUseCase, useValue: { execute: jest.fn() } },
        { provide: ReceiveAccountRecPaymentUseCase, useValue: { execute: jest.fn() } },
        { provide: ForceFinalizeAccountRecUseCase, useValue: { execute: jest.fn() } },
        { provide: PayAccountsRecWithMetalCreditUseCase, useValue: { execute: jest.fn() } },
        { provide: PayAccountsRecWithMetalUseCase, useValue: { execute: jest.fn() } },
        { provide: PayAccountsRecWithMetalCreditMultipleUseCase, useValue: { execute: jest.fn() } },
        { provide: PayAccountsRecWithMetalMultipleUseCase, useValue: { execute: jest.fn() } },
        { provide: HybridReceiveUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AccountsRecController>(AccountsRecController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
