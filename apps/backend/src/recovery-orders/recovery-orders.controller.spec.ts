import { Test, TestingModule } from '@nestjs/testing';
import { RecoveryOrdersController } from './recovery-orders.controller';
import { CreateRecoveryOrderUseCase } from './use-cases/create-recovery-order.use-case';
import { StartRecoveryOrderUseCase } from './use-cases/start-recovery-order.use-case';
import { UpdateRecoveryOrderPurityUseCase } from './use-cases/update-recovery-order-purity.use-case';
import { ProcessRecoveryFinalizationUseCase } from './use-cases/process-recovery-finalization.use-case';
import { AddRawMaterialToRecoveryOrderUseCase } from './use-cases/add-raw-material.use-case';
import { CancelRecoveryOrderUseCase } from './use-cases/cancel-recovery-order.use-case';
import { AssociateImageToRecoveryOrderUseCase } from './use-cases/associate-image-to-recovery-order.use-case';
import { GerarPdfRecoveryOrderUseCase } from './use-cases/gerar-pdf-recovery-order.use-case';
import { ApplyRecoveryOrderCommissionUseCase } from './use-cases/apply-recovery-order-commission.use-case';
import { UpdateRecoveryOrderUseCase } from './use-cases/update-recovery-order.use-case';
import { ListRecoveryOrdersUseCase } from './use-cases/list-recovery-orders.use-case';
import { GetRecoveryOrderByIdUseCase } from './use-cases/get-recovery-order-by-id.use-case';

describe('RecoveryOrdersController', () => {
  let controller: RecoveryOrdersController;
  let listUseCase: jest.Mocked<ListRecoveryOrdersUseCase>;
  let getByIdUseCase: jest.Mocked<GetRecoveryOrderByIdUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecoveryOrdersController],
      providers: [
        { provide: CreateRecoveryOrderUseCase, useValue: { execute: jest.fn() } },
        { provide: StartRecoveryOrderUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateRecoveryOrderPurityUseCase, useValue: { execute: jest.fn() } },
        { provide: ProcessRecoveryFinalizationUseCase, useValue: { execute: jest.fn() } },
        { provide: AddRawMaterialToRecoveryOrderUseCase, useValue: { execute: jest.fn() } },
        { provide: CancelRecoveryOrderUseCase, useValue: { execute: jest.fn() } },
        { provide: AssociateImageToRecoveryOrderUseCase, useValue: { execute: jest.fn() } },
        { provide: GerarPdfRecoveryOrderUseCase, useValue: { execute: jest.fn() } },
        { provide: ApplyRecoveryOrderCommissionUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateRecoveryOrderUseCase, useValue: { execute: jest.fn() } },
        { provide: ListRecoveryOrdersUseCase, useValue: { execute: jest.fn().mockResolvedValue([]) } },
        { provide: GetRecoveryOrderByIdUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<RecoveryOrdersController>(RecoveryOrdersController);
    listUseCase = module.get(ListRecoveryOrdersUseCase);
    getByIdUseCase = module.get(GetRecoveryOrderByIdUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getAllRecoveryOrders to ListRecoveryOrdersUseCase', async () => {
    const req = { user: { orgId: 'org-1' } };
    const result = await controller.getAllRecoveryOrders(req, {} as any);

    expect(listUseCase.execute).toHaveBeenCalledWith('org-1', {});
    expect(result).toEqual([]);
  });
});
