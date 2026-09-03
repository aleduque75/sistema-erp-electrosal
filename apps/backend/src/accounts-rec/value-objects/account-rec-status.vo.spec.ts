import { AccountRecStatusVO } from './account-rec-status.vo';

describe('AccountRecStatusVO', () => {
  it('should parse boolean and string values correctly', () => {
    expect(new AccountRecStatusVO(false).isPending).toBe(true);
    expect(new AccountRecStatusVO(true).isReceived).toBe(true);
    expect(new AccountRecStatusVO('PENDING').isPending).toBe(true);
    expect(new AccountRecStatusVO('RECEIVED').isReceived).toBe(true);
    expect(new AccountRecStatusVO('RECEBIDO').isReceived).toBe(true);
  });

  it('should throw on invalid status string', () => {
    expect(() => new AccountRecStatusVO('INVALIDO')).toThrow('Status de conta a receber inválido');
  });
});
