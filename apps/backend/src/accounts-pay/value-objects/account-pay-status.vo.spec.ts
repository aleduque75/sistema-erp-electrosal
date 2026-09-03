import { AccountPayStatusVO } from './account-pay-status.vo';

describe('AccountPayStatusVO', () => {
  it('should parse boolean and string values', () => {
    expect(new AccountPayStatusVO(false).isPending).toBe(true);
    expect(new AccountPayStatusVO(true).isPaid).toBe(true);
    expect(new AccountPayStatusVO('PENDING').isPending).toBe(true);
    expect(new AccountPayStatusVO('PAID').isPaid).toBe(true);
    expect(new AccountPayStatusVO('PAGO').isPaid).toBe(true);
  });

  it('should throw for invalid status', () => {
    expect(() => new AccountPayStatusVO('INVALIDO')).toThrow('Status de conta a pagar inválido');
  });
});
