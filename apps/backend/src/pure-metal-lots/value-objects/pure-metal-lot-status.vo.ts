import { PureMetalLotStatus } from '@prisma/client';

export class PureMetalLotStatusVO {
  private readonly _value: PureMetalLotStatus;

  constructor(status: string | PureMetalLotStatus) {
    const upper = String(status).trim().toUpperCase();
    if (upper === 'AVAILABLE' || upper === PureMetalLotStatus.AVAILABLE) {
      this._value = PureMetalLotStatus.AVAILABLE;
    } else if (upper === 'USED' || upper === PureMetalLotStatus.USED) {
      this._value = PureMetalLotStatus.USED;
    } else if (upper === 'PARTIALLY_USED' || upper === PureMetalLotStatus.PARTIALLY_USED) {
      this._value = PureMetalLotStatus.PARTIALLY_USED;
    } else {
      throw new Error(`Status de lote de metal puro inválido: "${status}". Valores permitidos: AVAILABLE, USED, PARTIALLY_USED.`);
    }
  }

  get value(): PureMetalLotStatus {
    return this._value;
  }

  isAvailable(): boolean {
    return this._value === PureMetalLotStatus.AVAILABLE;
  }

  isUsed(): boolean {
    return this._value === PureMetalLotStatus.USED;
  }

  isPartiallyUsed(): boolean {
    return this._value === PureMetalLotStatus.PARTIALLY_USED;
  }

  static fromGrams(initialGrams: number, remainingGrams: number): PureMetalLotStatusVO {
    if (remainingGrams <= 0) {
      return new PureMetalLotStatusVO(PureMetalLotStatus.USED);
    }
    if (remainingGrams >= initialGrams) {
      return new PureMetalLotStatusVO(PureMetalLotStatus.AVAILABLE);
    }
    return new PureMetalLotStatusVO(PureMetalLotStatus.PARTIALLY_USED);
  }
}
