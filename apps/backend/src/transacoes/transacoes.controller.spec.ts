import { Test, TestingModule } from '@nestjs/testing';
import { TransacoesController } from './transacoes.controller';
import { CreateTransacaoUseCase } from './use-cases/create-transacao.use-case';
import { CreateTransferUseCase } from './use-cases/create-transfer.use-case';
import { UpdateTransacaoUseCase } from './use-cases/update-transacao.use-case';
import { DeleteTransacaoUseCase } from './use-cases/delete-transacao.use-case';
import { ListTransacoesUseCase } from './use-cases/list-transacoes.use-case';
import { GetTransacaoUseCase } from './use-cases/get-transacao.use-case';
import { FindUnlinkedTransacoesUseCase } from './use-cases/find-unlinked-transacoes.use-case';
import { LinkAccountUseCase } from './use-cases/link-account.use-case';
import { BulkCreateTransacoesUseCase } from './use-cases/bulk-create-transacoes.use-case';
import { BulkUpdateTransacoesUseCase } from './use-cases/bulk-update-transacoes.use-case';
import { UpdateTransactionUseCase } from './use-cases/update-transaction.use-case';

describe('TransacoesController', () => {
  let controller: TransacoesController;
  let createTransacaoUseCase: jest.Mocked<CreateTransacaoUseCase>;
  let createTransferUseCase: jest.Mocked<CreateTransferUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransacoesController],
      providers: [
        {
          provide: CreateTransacaoUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ id: 'tx-1' }) },
        },
        {
          provide: CreateTransferUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ debitTransaction: {}, creditTransaction: {} }) },
        },
        {
          provide: UpdateTransacaoUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ id: 'tx-1' }) },
        },
        {
          provide: DeleteTransacaoUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ListTransacoesUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([{ id: 'tx-1' }]) },
        },
        {
          provide: GetTransacaoUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ id: 'tx-1' }) },
        },
        {
          provide: FindUnlinkedTransacoesUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: LinkAccountUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ id: 'tx-1' }) },
        },
        {
          provide: BulkCreateTransacoesUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ count: 5 }) },
        },
        {
          provide: BulkUpdateTransacoesUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({ count: 2 }),
            executeContaContabil: jest.fn().mockResolvedValue({ count: 3 }),
          },
        },
        {
          provide: UpdateTransactionUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get<TransacoesController>(TransacoesController);
    createTransacaoUseCase = module.get(CreateTransacaoUseCase);
    createTransferUseCase = module.get(CreateTransferUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate create to CreateTransacaoUseCase', async () => {
    const dto = { valor: 100 } as any;
    const result = await controller.create(dto, 'org-1');

    expect(createTransacaoUseCase.execute).toHaveBeenCalledWith(dto, 'org-1');
    expect(result).toEqual({ id: 'tx-1' });
  });

  it('should delegate transfer to CreateTransferUseCase', async () => {
    const dto = { amount: 500 } as any;
    await controller.createTransfer('org-1', dto);

    expect(createTransferUseCase.execute).toHaveBeenCalledWith('org-1', dto);
  });
});
