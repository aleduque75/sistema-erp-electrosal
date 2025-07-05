import { Test, TestingModule } from '@nestjs/testing';
import { AccountsRecService } from './accounts-rec.service';

describe('AccountsRecService', () => {
  let service: AccountsRecService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsRecService],
    }).compile();

    service = module.get<AccountsRecService>(AccountsRecService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
