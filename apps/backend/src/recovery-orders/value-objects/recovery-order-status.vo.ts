import { RecoveryOrderStatusPrisma } from '@prisma/client';

export type RecoveryOrderStatusType = RecoveryOrderStatusPrisma;

export class RecoveryOrderStatusVO {
  private readonly _value: RecoveryOrderStatusPrisma;

  private static readonly VALID_STATUSES = Object.values(RecoveryOrderStatusPrisma);

  constructor(status: string | RecoveryOrderStatusPrisma) {
    const upper = (status || '').toString().toUpperCase() as RecoveryOrderStatusPrisma;
    if (!RecoveryOrderStatusVO.VALID_STATUSES.includes(upper)) {
      throw new Error(
        `Status '${status}' inválido. Válidos: ${RecoveryOrderStatusVO.VALID_STATUSES.join(', ')}`,
      );
    }
    this._value = upper;
  }

  get value(): RecoveryOrderStatusPrisma {
    return this._value;
  }

  isPendente(): boolean {
    return this._value === RecoveryOrderStatusPrisma.PENDENTE;
  }

  isEmAndamento(): boolean {
    return this._value === RecoveryOrderStatusPrisma.EM_ANDAMENTO;
  }

  isAguardandoTeor(): boolean {
    return this._value === RecoveryOrderStatusPrisma.AGUARDANDO_TEOR;
  }

  isFinalizada(): boolean {
    return this._value === RecoveryOrderStatusPrisma.FINALIZADA;
  }

  isCancelada(): boolean {
    return this._value === RecoveryOrderStatusPrisma.CANCELADA;
  }

  ensureCanStart(): void {
    if (!this.isPendente()) {
      throw new Error(
        `A ordem de recuperação só pode ser iniciada se estiver com o status PENDENTE (atual: ${this._value}).`,
      );
    }
  }

  ensureCanFinalize(): void {
    if (!this.isAguardandoTeor()) {
      throw new Error(
        `A ordem de recuperação só pode ser finalizada se estiver com o status AGUARDANDO_TEOR (atual: ${this._value}).`,
      );
    }
  }

  ensureCanCancel(): void {
    if (this.isFinalizada()) {
      throw new Error('Uma ordem de recuperação já FINALIZADA não pode ser cancelada.');
    }
    if (this.isCancelada()) {
      throw new Error('A ordem de recuperação já se encontra CANCELADA.');
    }
  }
}
