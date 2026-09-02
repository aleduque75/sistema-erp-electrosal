import { Test, TestingModule } from '@nestjs/testing';
import { MetalPaymentsController } from './metal-payments.controller';
import { PayClientWithMetalUseCase } from './use-cases/pay-client-with-metal.use-case';

describe('MetalPaymentsController', () => {
  let controller: MetalPaymentsController;
  let useCase: jest.Mocked<PayClientWithMetalUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetalPaymentsController],
      providers: [
        {
          provide: PayClientWithMetalUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({ message: 'OK' }),
          },
        },
      ],
    }).compile();

    controller = module.get<MetalPaymentsController>(MetalPaymentsController);
    useCase = module.get(PayClientWithMetalUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate payClientWithMetal to use case', async () => {
    const dto = { clientId: 'cli-1', grams: 5 } as any;
    const result = await controller.payClientWithMetal('org-1', 'user-1', dto);

    expect(useCase.execute).toHaveBeenCalledWith('org-1', 'user-1', dto);
    expect(result).toEqual({ message: 'OK' });
  });
});
