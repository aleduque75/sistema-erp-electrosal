import { PureMetalLotMovementType } from '@prisma/client';

export class PureMetalLotMovementTypeVO {
  private readonly _value: PureMetalLotMovementType;

  constructor(type: string | PureMetalLotMovementType) {
    const upper = String(type).trim().toUpperCase();
    if (upper === 'ENTRY' || upper === PureMetalLotMovementType.ENTRY) {
      this._value = PureMetalLotMovementType.ENTRY;
    } else if (upper === 'EXIT' || upper === PureMetalLotMovementType.EXIT) {
      this._value = PureMetalLotMovementType.EXIT;
    } else if (upper === 'ADJUSTMENT' || upper === PureMetalLotMovementType.ADJUSTMENT) {
      this._value = PureMetalLotMovementType.ADJUSTMENT;
    } else {
      throw new Error(`Tipo de movimentação de lote inválido: "${type}". Valores permitidos: ENTRY, EXIT, ADJUSTMENT.`);
    }
  }

  get value(): PureMetalLotMovementType {
    return this._value;
  }

  isEntry(): boolean {
    return this._value === PureMetalLotMovementType.ENTRY;
  }

  isExit(): boolean {
    return this._value === PureMetalLotMovementType.EXIT;
  }

  isAdjustment(): boolean {
    return this._value === PureMetalLotMovementType.ADJUSTMENT;
  }
}
