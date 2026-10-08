import { BulkUpdateTransacoesUseCase } from './bulk-update-transacoes.use-case';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';
import { TipoTransacaoVO } from '../value-objects/tipo-transacao.vo';

describe('BulkUpdateTransacoesUseCase', () => {
  let useCase: BulkUpdateTransacoesUseCase;
  let mockRepository: jest.Mocked<TransacaoRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      findUnlinked: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      findContaCorrente: jest.fn(),
      findLatestQuotation: jest.fn(),
      findAccountRec: jest.fn(),
      updateAccountRec: jest.fn(),
      findTransactionsByAccountRec: jest.fn(),
      createAccountPay: jest.fn(),
      findPureMetalLotBySource: jest.fn(),
      deletePureMetalLotWithMovements: jest.fn(),
      executeInTransaction: jest.fn().mockImplementation((fn) => fn({})),
    };

    useCase = new BulkUpdateTransacoesUseCase(mockRepository);
  });

  it('should update contaContabil and fornecedor via updateMany when goldPrice is not provided', async () => {
    mockRepository.updateMany.mockResolvedValue({ count: 2 });

    const result = await useCase.execute(
      {
        transactionIds: ['tx-1', 'tx-2'],
        contaContabilId: 'cc-1',
        fornecedorId: 'forn-1',
      },
      'org-1',
    );

    expect(mockRepository.updateMany).toHaveBeenCalledWith(
      ['tx-1', 'tx-2'],
      'org-1',
      {
        contaContabilId: 'cc-1',
        fornecedorId: 'forn-1',
      },
    );
    expect(result).toEqual({ count: 2 });
  });

  it('should recalculate goldAmount and update each transaction when goldPrice is provided', async () => {
    const tx1 = TransacaoEntity.create({
      id: 'tx-1',
      tipo: 'DEBITO',
      valor: 1000,
      contaContabilId: 'cc-old',
      organizationId: 'org-1',
    });

    const tx2 = TransacaoEntity.create({
      id: 'tx-2',
      tipo: 'CREDITO',
      valor: 2500,
      contaContabilId: 'cc-old',
      organizationId: 'org-1',
    });

    mockRepository.findByIds.mockResolvedValue([tx1, tx2]);
    mockRepository.update.mockResolvedValue(tx1);

    const result = await useCase.execute(
      {
        transactionIds: ['tx-1', 'tx-2'],
        goldPrice: 500,
      },
      'org-1',
    );

    expect(mockRepository.findByIds).toHaveBeenCalledWith(
      ['tx-1', 'tx-2'],
      'org-1',
      expect.anything(),
    );
    expect(mockRepository.update).toHaveBeenCalledTimes(2);

    // tx1: valor 1000 / 500 = 2.0000g
    const firstCallEntity: TransacaoEntity = mockRepository.update.mock.calls[0][0];
    expect(firstCallEntity.goldPrice).toBe(500);
    expect(firstCallEntity.goldAmount).toBe(2);

    // tx2: valor 2500 / 500 = 5.0000g
    const secondCallEntity: TransacaoEntity = mockRepository.update.mock.calls[1][0];
    expect(secondCallEntity.goldPrice).toBe(500);
    expect(secondCallEntity.goldAmount).toBe(5);

    expect(result).toEqual({ count: 2 });
  });
});
