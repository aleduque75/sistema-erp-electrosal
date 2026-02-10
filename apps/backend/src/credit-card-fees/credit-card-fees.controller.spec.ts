import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardFeesController } from './credit-card-fees.controller';
import { CreditCardFeesService } from './credit-card-fees.service';

describe('CreditCardFeesController', () => {
  let controller: CreditCardFeesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardFeesController],
      providers: [
        {
          provide: CreditCardFeesService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CreditCardFeesController>(CreditCardFeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
