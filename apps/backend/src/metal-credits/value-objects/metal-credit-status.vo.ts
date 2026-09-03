import { MetalCreditStatus } from '@prisma/client';

export class MetalCreditStatusVO {
  private readonly _value: MetalCreditStatus;

  constructor(status: string | MetalCreditStatus) {
    const upper = String(status).trim().toUpperCase();
    if (upper === 'PENDING' || upper === MetalCreditStatus.PENDING) {
      this._value = MetalCreditStatus.PENDING;
    } else if (
      upper === 'PARTIALLY_PAID' ||
      upper === 'PARTIALLY_SETTLED' ||
      upper === MetalCreditStatus.PARTIALLY_PAID
    ) {
      this._value = MetalCreditStatus.PARTIALLY_PAID;
    } else if (
      upper === 'PAID' ||
      upper === 'SETTLED' ||
      upper === MetalCreditStatus.PAID
    ) {
      this._value = MetalCreditStatus.PAID;
    } else if (
      upper === 'CANCELED' ||
      upper === 'CANCELLED' ||
      upper === MetalCreditStatus.CANCELED
    ) {
      this._value = MetalCreditStatus.CANCELED;
    } else {
      throw new Error(`Status de crédito de metal inválido: "${status}".`);
    }
  }

  get value(): MetalCreditStatus {
    return this._value;
  }

  isPending(): boolean {
    return this._value === MetalCreditStatus.PENDING;
  }

  isPaid(): boolean {
    return this._value === MetalCreditStatus.PAID;
  }

  isPartiallyPaid(): boolean {
    return this._value === MetalCreditStatus.PARTIALLY_PAID;
  }

  isCanceled(): boolean {
    return this._value === MetalCreditStatus.CANCELED;
  }

  static fromGrams(totalGrams: number, settledGrams: number): MetalCreditStatusVO {
    if (settledGrams <= 0) {
      return new MetalCreditStatusVO(MetalCreditStatus.PENDING);
    }
    if (settledGrams >= totalGrams) {
      return new MetalCreditStatusVO(MetalCreditStatus.PAID);
    }
    return new MetalCreditStatusVO(MetalCreditStatus.PARTIALLY_PAID);
  }
}
