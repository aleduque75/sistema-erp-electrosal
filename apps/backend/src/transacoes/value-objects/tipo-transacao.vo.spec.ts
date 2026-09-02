import { TipoTransacaoVO } from './tipo-transacao.vo';
import { TipoTransacaoPrisma } from '@prisma/client';

describe('TipoTransacaoVO', () => {
  it('should create valid CREDITO and DEBITO value objects', () => {
    const credito = TipoTransacaoVO.create('CREDITO');
    expect(credito.value).toBe(TipoTransacaoPrisma.CREDITO);
    expect(credito.isCredito()).toBe(true);
    expect(credito.isDebito()).toBe(false);

    const debito = TipoTransacaoVO.create('debito');
    expect(debito.value).toBe(TipoTransacaoPrisma.DEBITO);
    expect(debito.isDebito()).toBe(true);
    expect(debito.isCredito()).toBe(false);
  });

  it('should throw error for invalid transaction types', () => {
    expect(() => TipoTransacaoVO.create('INVALIDO')).toThrow('Tipo de transação inválido');
    expect(() => TipoTransacaoVO.create('')).toThrow('Tipo de transação inválido');
  });
});
