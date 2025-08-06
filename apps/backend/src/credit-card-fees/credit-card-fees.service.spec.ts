import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardFeesService } from './credit-card-fees.service';

describe('CreditCardFeesService', () => {
  let service: CreditCardFeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreditCardFeesService],
    }).compile();

    service = module.get<CreditCardFeesService>(CreditCardFeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
