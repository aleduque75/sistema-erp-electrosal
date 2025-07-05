import { Test, TestingModule } from '@nestjs/testing';
import { AccountsPayController } from './accounts-pay.controller';

describe('AccountsPayController', () => {
  let controller: AccountsPayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsPayController],
    }).compile();

    controller = module.get<AccountsPayController>(AccountsPayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
