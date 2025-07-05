import { Test, TestingModule } from '@nestjs/testing';
import { AccountsRecController } from './accounts-rec.controller';

describe('AccountsRecController', () => {
  let controller: AccountsRecController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsRecController],
    }).compile();

    controller = module.get<AccountsRecController>(AccountsRecController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
