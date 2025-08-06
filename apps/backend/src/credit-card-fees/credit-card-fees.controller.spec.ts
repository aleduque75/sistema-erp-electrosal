import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardFeesController } from './credit-card-fees.controller';

describe('CreditCardFeesController', () => {
  let controller: CreditCardFeesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardFeesController],
    }).compile();

    controller = module.get<CreditCardFeesController>(CreditCardFeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
