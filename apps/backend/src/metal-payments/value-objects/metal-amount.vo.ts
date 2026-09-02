import Decimal from 'decimal.js';

export class MetalAmountVO {
  private readonly _grams: Decimal;

  constructor(grams: number | string | Decimal) {
    const value = new Decimal(grams);
    if (value.isNaN() || !value.isFinite()) {
      throw new Error('Quantidade de metal inválida.');
    }
    if (value.lessThanOrEqualTo(0)) {
      throw new Error('A quantidade de metal deve ser estritamente positiva.');
    }
    this._grams = value.toDecimalPlaces(4);
  }

  get value(): number {
    return this._grams.toNumber();
  }

  get decimal(): Decimal {
    return this._grams;
  }

  isGreaterThan(other: MetalAmountVO | number): boolean {
    const otherDecimal = other instanceof MetalAmountVO ? other.decimal : new Decimal(other);
    return this._grams.greaterThan(otherDecimal);
  }

  isLessThan(other: MetalAmountVO | number): boolean {
    const otherDecimal = other instanceof MetalAmountVO ? other.decimal : new Decimal(other);
    return this._grams.lessThan(otherDecimal);
  }

  toNegative(): Decimal {
    return this._grams.negated();
  }

  multiply(price: Decimal | number): Decimal {
    return this._grams.times(price).toDecimalPlaces(2);
  }
}
