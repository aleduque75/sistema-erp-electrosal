import { CreateTransacaoUseCase } from './create-transacao.use-case';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { MediaService } from '../../media/media.service';
import { TipoTransacaoPrisma } from '@prisma/client';
import { TransacaoEntity } from '../entities/transacao.entity';

describe('CreateTransacaoUseCase', () => {
  let useCase: CreateTransacaoUseCase;
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

    useCase = new CreateTransacaoUseCase(mockRepository, mockMediaService);
  });

  it('should create a transaction successfully', async () => {
    const fakeCreated = TransacaoEntity.create({
      id: 'tx-123',
      tipo: TipoTransacaoPrisma.CREDITO,
      valor: 500,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
    });

    mockRepository.create.mockResolvedValue(fakeCreated);
    mockRepository.findById.mockResolvedValue(fakeCreated);

    const result = await useCase.execute(
      {
        tipo: TipoTransacaoPrisma.CREDITO,
        valor: 500,
        contaContabilId: 'cc-1',
      } as any,
      'org-1',
    );

    expect(mockRepository.create).toHaveBeenCalled();
    expect(result.id).toBe('tx-123');
    expect(result.valor).toBe(500);
  });

  it('should create AccountPay when transaction is DEBITO with fornecedorId', async () => {
    const fakeCreated = TransacaoEntity.create({
      id: 'tx-debito',
      tipo: TipoTransacaoPrisma.DEBITO,
      valor: 350,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
      fornecedorId: 'forn-1',
    });

    mockRepository.create.mockResolvedValue(fakeCreated);
    mockRepository.findById.mockResolvedValue(fakeCreated);

    await useCase.execute(
      {
        tipo: TipoTransacaoPrisma.DEBITO,
        valor: 350,
        contaContabilId: 'cc-1',
        fornecedorId: 'forn-1',
        descricao: 'Compra de suprimentos',
      } as any,
      'org-1',
    );

    expect(mockRepository.createAccountPay).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        fornecedorId: 'forn-1',
        amount: 350,
        paid: true,
      }),
      expect.anything(),
    );
  });
});
