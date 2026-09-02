import { RecoveryOrderStatusVO } from './recovery-order-status.vo';
import { RecoveryOrderStatusPrisma } from '@prisma/client';

describe('RecoveryOrderStatusVO', () => {
  it('should accept valid status', () => {
    const vo = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.PENDENTE);
    expect(vo.value).toBe(RecoveryOrderStatusPrisma.PENDENTE);
    expect(vo.isPendente()).toBe(true);
  });

  it('should reject invalid status', () => {
    expect(() => new RecoveryOrderStatusVO('INVALIDO')).toThrow("Status 'INVALIDO' inválido.");
  });

  it('should validate start transition', () => {
    const pendente = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.PENDENTE);
    expect(() => pendente.ensureCanStart()).not.toThrow();

    const emAndamento = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.EM_ANDAMENTO);
    expect(() => emAndamento.ensureCanStart()).toThrow('A ordem de recuperação só pode ser iniciada se estiver com o status PENDENTE');
  });

  it('should validate finalize transition', () => {
    const aguardando = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.AGUARDANDO_TEOR);
    expect(() => aguardando.ensureCanFinalize()).not.toThrow();

    const pendente = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.PENDENTE);
    expect(() => pendente.ensureCanFinalize()).toThrow('A ordem de recuperação só pode ser finalizada se estiver com o status AGUARDANDO_TEOR');
  });

  it('should validate cancel transition', () => {
    const finalizada = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.FINALIZADA);
    expect(() => finalizada.ensureCanCancel()).toThrow('Uma ordem de recuperação já FINALIZADA não pode ser cancelada.');
  });
});
