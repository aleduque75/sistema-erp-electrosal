import { TransacaoMapper, PrismaTransacaoWithRelations } from './transacao.mapper';
import { Prisma, TipoTransacaoPrisma, TransacaoStatus } from '@prisma/client';

describe('TransacaoMapper', () => {
  const mockPrismaTransacao: PrismaTransacaoWithRelations = {
    id: 'tx-1',
    tipo: TipoTransacaoPrisma.CREDITO,
    valor: new Prisma.Decimal('1250.75'),
    moeda: 'BRL',
    descricao: 'Pagamento recebido',
    dataHora: new Date('2026-03-01'),
    contaContabilId: 'cc-1',
    contaCorrenteId: 'bank-1',
    organizationId: 'org-1',
    goldAmount: new Prisma.Decimal('3.5000'),
    goldPrice: new Prisma.Decimal('357.35'),
    status: TransacaoStatus.ATIVA,
    fitId: 'fit-123',
    accountRecId: 'rec-1',
    linkedTransactionId: null,
    fornecedorId: null,
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
    medias: [],
    contaContabil: { id: 'cc-1', nome: 'Receitas' },
    contaCorrente: { id: 'bank-1', nome: 'Banco do Brasil' },
  };

  it('should map Prisma to domain entity', () => {
    const entity = TransacaoMapper.toDomain(mockPrismaTransacao);

    expect(entity.id).toBe('tx-1');
    expect(entity.valor).toBe(1250.75);
    expect(entity.goldAmount).toBe(3.5);
    expect(entity.goldPrice).toBe(357.35);
    expect(entity.tipo.value).toBe(TipoTransacaoPrisma.CREDITO);
    expect(entity.contaContabil?.nome).toBe('Receitas');
  });

  it('should map domain entity to persistence input', () => {
    const entity = TransacaoMapper.toDomain(mockPrismaTransacao);
    const persistence = TransacaoMapper.toPersistence(entity);

    expect(persistence.id).toBe('tx-1');
    expect(persistence.valor).toEqual(new Prisma.Decimal(1250.75));
    expect(persistence.contaContabilId).toBe('cc-1');
  });

  it('should map domain entity to response DTO', () => {
    const entity = TransacaoMapper.toDomain(mockPrismaTransacao);
    const dto = TransacaoMapper.toResponseDto(entity);

    expect(dto.id).toBe('tx-1');
    expect(dto.valor).toBe(1250.75);
    expect(dto.status).toBe('ATIVA');
  });
});
