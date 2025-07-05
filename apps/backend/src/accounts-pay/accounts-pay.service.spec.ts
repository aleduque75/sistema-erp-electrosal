import { Test, TestingModule } from '@nestjs/testing';
import { AccountsPayService } from './accounts-pay.service';

describe('AccountsPayService', () => {
  let service: AccountsPayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsPayService],
    }).compile();

    service = module.get<AccountsPayService>(AccountsPayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
