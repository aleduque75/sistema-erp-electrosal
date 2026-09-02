import { TransacaoStatusVO } from './transacao-status.vo';
import { TransacaoStatus } from '@prisma/client';

describe('TransacaoStatusVO', () => {
  it('should create valid status value objects', () => {
    const ativa = TransacaoStatusVO.create('ATIVA');
    expect(ativa.value).toBe(TransacaoStatus.ATIVA);
    expect(ativa.isAtiva()).toBe(true);

    const ajustada = TransacaoStatusVO.create('AJUSTADA');
    expect(ajustada.isAjustada()).toBe(true);

    const cancelada = TransacaoStatusVO.create('CANCELADA');
    expect(cancelada.isCancelada()).toBe(true);
  });

  it('should transition status correctly', () => {
    const ativa = TransacaoStatusVO.create(TransacaoStatus.ATIVA);
    const ajustada = ativa.transitionTo(TransacaoStatus.AJUSTADA);
    expect(ajustada.isAjustada()).toBe(true);

    const cancelada = ajustada.transitionTo(TransacaoStatus.CANCELADA);
    expect(cancelada.isCancelada()).toBe(true);

    expect(() => cancelada.transitionTo(TransacaoStatus.ATIVA)).toThrow(
      'Transação cancelada não pode mudar de status.',
    );
  });

  it('should throw error for invalid status', () => {
    expect(() => TransacaoStatusVO.create('INVALIDO')).toThrow(
      'Status de transação inválido',
    );
  });
});
