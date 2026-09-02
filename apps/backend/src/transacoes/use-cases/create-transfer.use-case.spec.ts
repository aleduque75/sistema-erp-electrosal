import { CreateTransferUseCase } from './create-transfer.use-case';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { MediaService } from '../../media/media.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransacaoEntity } from '../entities/transacao.entity';
import { TipoTransacaoPrisma } from '@prisma/client';

describe('CreateTransferUseCase', () => {
  let useCase: CreateTransferUseCase;
  let mockRepository: jest.Mocked<TransacaoRepository>;
  let mockMediaService: jest.Mocked<MediaService>;

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
      executeInTransaction: jest.fn().mockImplementation((fn) => fn({})),
    };

    mockMediaService = {
      associateMediaWithTransacao: jest.fn(),
    } as any;

    useCase = new CreateTransferUseCase(mockRepository, mockMediaService);
  });

  it('should throw BadRequestException if neither amount nor goldAmount is provided', async () => {
    await expect(
      useCase.execute('org-1', {
        sourceAccountId: 'acc-1',
        destinationAccountId: 'acc-2',
        contaContabilId: 'cc-1',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if source account is not found', async () => {
    mockRepository.findContaCorrente.mockResolvedValueOnce(null);

    await expect(
      useCase.execute('org-1', {
        sourceAccountId: 'acc-not-found',
        destinationAccountId: 'acc-2',
        contaContabilId: 'cc-1',
        amount: 1000,
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should create paired transfer transactions successfully', async () => {
    mockRepository.findContaCorrente
      .mockResolvedValueOnce({ id: 'acc-1', nome: 'Banco A' })
      .mockResolvedValueOnce({ id: 'acc-2', nome: 'Banco B' });

    const debitTx = TransacaoEntity.create({
      id: 'tx-deb',
      tipo: TipoTransacaoPrisma.DEBITO,
      valor: 1000,
      contaContabilId: 'cc-1',
      contaCorrenteId: 'acc-1',
      organizationId: 'org-1',
    });

    const creditTx = TransacaoEntity.create({
      id: 'tx-cred',
      tipo: TipoTransacaoPrisma.CREDITO,
      valor: 1000,
      contaContabilId: 'cc-1',
      contaCorrenteId: 'acc-2',
      organizationId: 'org-1',
    });

    mockRepository.create
      .mockResolvedValueOnce(debitTx)
      .mockResolvedValueOnce(creditTx);

    mockRepository.findById
      .mockResolvedValueOnce(debitTx)
      .mockResolvedValueOnce(creditTx);

    const result = await useCase.execute('org-1', {
      sourceAccountId: 'acc-1',
      destinationAccountId: 'acc-2',
      contaContabilId: 'cc-1',
      amount: 1000,
      quotation: 350,
    });

    expect(mockRepository.create).toHaveBeenCalledTimes(2);
    expect(result.debitTransaction.id).toBe('tx-deb');
    expect(result.creditTransaction.id).toBe('tx-cred');
  });
});
