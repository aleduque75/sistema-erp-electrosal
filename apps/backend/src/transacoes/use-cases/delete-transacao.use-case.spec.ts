import { DeleteTransacaoUseCase } from './delete-transacao.use-case';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { NotFoundException } from '@nestjs/common';
import { TransacaoEntity } from '../entities/transacao.entity';
import { TipoTransacaoPrisma } from '@prisma/client';

describe('DeleteTransacaoUseCase', () => {
  let useCase: DeleteTransacaoUseCase;
  let mockRepository: jest.Mocked<TransacaoRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
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
      findPureMetalLotBySource: jest.fn().mockResolvedValue(null),
      deletePureMetalLotWithMovements: jest.fn().mockResolvedValue(undefined),
      executeInTransaction: jest.fn().mockImplementation((fn) => fn({})),
    };

    useCase = new DeleteTransacaoUseCase(mockRepository);
  });

  it('should throw NotFoundException if transaction does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('tx-999', 'org-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete a standalone transaction', async () => {
    const tx = TransacaoEntity.create({
      id: 'tx-single',
      tipo: TipoTransacaoPrisma.CREDITO,
      valor: 100,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
    });

    mockRepository.findById.mockResolvedValue(tx);

    await useCase.execute('tx-single', 'org-1');

    expect(mockRepository.delete).toHaveBeenCalledWith('tx-single', expect.anything());
  });

  it('should delete both transactions when it is a transfer', async () => {
    const tx1 = TransacaoEntity.create({
      id: 'tx-1',
      tipo: TipoTransacaoPrisma.DEBITO,
      valor: 200,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
      linkedTransactionId: 'tx-2',
    });

    const tx2 = TransacaoEntity.create({
      id: 'tx-2',
      tipo: TipoTransacaoPrisma.CREDITO,
      valor: 200,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
      linkedTransactionId: 'tx-1',
    });

    mockRepository.findById
      .mockResolvedValueOnce(tx1)
      .mockResolvedValueOnce(tx2);

    await useCase.execute('tx-1', 'org-1');

    expect(mockRepository.delete).toHaveBeenCalledWith('tx-2', expect.anything());
    expect(mockRepository.delete).toHaveBeenCalledWith('tx-1', expect.anything());
  });

  it('should delete linked pure metal lot when transaction created one', async () => {
    const tx = TransacaoEntity.create({
      id: 'tx-transfer',
      tipo: TipoTransacaoPrisma.DEBITO,
      valor: 500,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
    });

    mockRepository.findById.mockResolvedValue(tx);
    mockRepository.findPureMetalLotBySource.mockResolvedValue({
      id: 'lot-1',
      initialGrams: 100,
      remainingGrams: 100,
      chemicalReactions: [],
    });

    await useCase.execute('tx-transfer', 'org-1');

    expect(mockRepository.deletePureMetalLotWithMovements).toHaveBeenCalledWith(
      'lot-1',
      'org-1',
      expect.anything(),
    );
    expect(mockRepository.delete).toHaveBeenCalledWith('tx-transfer', expect.anything());
  });
});
