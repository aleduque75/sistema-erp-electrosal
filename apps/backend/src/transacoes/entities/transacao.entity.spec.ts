import { TransacaoEntity } from './transacao.entity';
import { TipoTransacaoPrisma, TransacaoStatus } from '@prisma/client';

describe('TransacaoEntity', () => {
  it('should create a valid TransacaoEntity', () => {
    const transacao = TransacaoEntity.create({
      id: 'tx-1',
      tipo: TipoTransacaoPrisma.CREDITO,
      valor: 1500.5,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
      descricao: 'Venda à vista',
    });

    expect(transacao.id).toBe('tx-1');
    expect(transacao.tipo.value).toBe(TipoTransacaoPrisma.CREDITO);
    expect(transacao.valor).toBe(1500.5);
    expect(transacao.status.value).toBe(TransacaoStatus.ATIVA);
    expect(transacao.isTransfer()).toBe(false);
  });

  it('should throw error when required fields are missing', () => {
    expect(() =>
      TransacaoEntity.create({
        tipo: TipoTransacaoPrisma.CREDITO,
        valor: 100,
        contaContabilId: '',
        organizationId: 'org-1',
      }),
    ).toThrow('A conta contábil é obrigatória');

    expect(() =>
      TransacaoEntity.create({
        tipo: TipoTransacaoPrisma.CREDITO,
        valor: 100,
        contaContabilId: 'cc-1',
        organizationId: '',
      }),
    ).toThrow('A organização é obrigatória');
  });

  it('should allow linking account and transactions', () => {
    const transacao = TransacaoEntity.create({
      tipo: TipoTransacaoPrisma.DEBITO,
      valor: 500,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
    });

    expect(transacao.contaCorrenteId).toBeNull();
    transacao.linkAccount('bank-1');
    expect(transacao.contaCorrenteId).toBe('bank-1');

    transacao.linkTransaction('tx-2');
    expect(transacao.linkedTransactionId).toBe('tx-2');
    expect(transacao.isTransfer()).toBe(true);
  });

  it('should cancel and adjust transaction', () => {
    const transacao = TransacaoEntity.create({
      tipo: TipoTransacaoPrisma.CREDITO,
      valor: 1000,
      contaContabilId: 'cc-1',
      organizationId: 'org-1',
    });

    transacao.markAsAdjusted();
    expect(transacao.status.isAjustada()).toBe(true);

    transacao.cancel();
    expect(transacao.status.isCancelada()).toBe(true);
  });
});
