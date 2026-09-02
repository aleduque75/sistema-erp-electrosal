import { StockUnit } from '@prisma/client';

export class StockUnitVO {
  private static readonly VALID_UNITS: StockUnit[] = [
    StockUnit.GRAMS,
    StockUnit.KILOGRAMS,
    StockUnit.UNITS,
    StockUnit.LITERS,
  ];

  private readonly _value: StockUnit;

  private constructor(value: StockUnit) {
    this._value = value;
  }

  static create(unit?: string | StockUnit): StockUnitVO {
    if (!unit) {
      return new StockUnitVO(StockUnit.GRAMS);
    }

    const normalized = (typeof unit === 'string' ? unit.trim().toUpperCase() : unit) as StockUnit;

    if (!StockUnitVO.VALID_UNITS.includes(normalized)) {
      throw new Error(
        `Unidade de estoque inválida: "${unit}". Unidades permitidas: ${StockUnitVO.VALID_UNITS.join(', ')}`,
      );
    }

    return new StockUnitVO(normalized);
  }

  static isValid(unit: string): boolean {
    const normalized = unit?.trim().toUpperCase() as StockUnit;
    return StockUnitVO.VALID_UNITS.includes(normalized);
  }

  get value(): StockUnit {
    return this._value;
  }

  equals(other: StockUnitVO): boolean {
    if (!other) return false;
    return this._value === other.value;
  }

  toString(): string {
    return this._value;
  }
}
