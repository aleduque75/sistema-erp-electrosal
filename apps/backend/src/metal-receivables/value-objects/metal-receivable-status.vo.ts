import { ReceivableStatus } from '@prisma/client';

export class MetalReceivableStatusVO {
  private readonly _value: ReceivableStatus;

  constructor(status: string | ReceivableStatus) {
    const upper = String(status).trim().toUpperCase();
    if (upper === 'PENDENTE' || upper === ReceivableStatus.PENDENTE) {
      this._value = ReceivableStatus.PENDENTE;
    } else if (upper === 'PAGO' || upper === ReceivableStatus.PAGO) {
      this._value = ReceivableStatus.PAGO;
    } else if (upper === 'ATRASADO' || upper === ReceivableStatus.ATRASADO) {
      this._value = ReceivableStatus.ATRASADO;
    } else if (upper === 'CANCELADO' || upper === ReceivableStatus.CANCELADO) {
      this._value = ReceivableStatus.CANCELADO;
    } else if (upper === 'PAGO_PARCIALMENTE' || upper === ReceivableStatus.PAGO_PARCIALMENTE) {
      this._value = ReceivableStatus.PAGO_PARCIALMENTE;
    } else {
      throw new Error(`Status de recebível de metal inválido: "${status}".`);
    }
  }

  get value(): ReceivableStatus {
    return this._value;
  }

  isPendente(): boolean {
    return this._value === ReceivableStatus.PENDENTE;
  }

  isPago(): boolean {
    return this._value === ReceivableStatus.PAGO;
  }

  isCancelado(): boolean {
    return this._value === ReceivableStatus.CANCELADO;
  }
}
