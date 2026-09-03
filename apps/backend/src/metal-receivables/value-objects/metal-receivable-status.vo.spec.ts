import { MetalReceivableStatusVO } from './metal-receivable-status.vo';
import { ReceivableStatus } from '@prisma/client';

describe('MetalReceivableStatusVO', () => {
  it('should parse valid statuses', () => {
    expect(new MetalReceivableStatusVO('PENDENTE').isPendente()).toBe(true);
    expect(new MetalReceivableStatusVO(ReceivableStatus.PAGO).isPago()).toBe(true);
    expect(new MetalReceivableStatusVO('CANCELADO').isCancelado()).toBe(true);
  });

  it('should throw for invalid status', () => {
    expect(() => new MetalReceivableStatusVO('INVALIDO')).toThrow('Status de recebível de metal inválido');
  });
});
