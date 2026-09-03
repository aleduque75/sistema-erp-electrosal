import Decimal from 'decimal.js';

export class MetalAmountVO {
  private readonly _grams: Decimal;

  constructor(grams: number | string | Decimal, allowZero: boolean = false) {
    const value = new Decimal(grams);
    if (value.isNaN() || !value.isFinite()) {
      throw new Error('Quantidade de metal inválida.');
    }
    if (allowZero) {
      if (value.isNegative()) {
        throw new Error('A quantidade de metal não pode ser negativa.');
      }
    } else {
      if (value.lessThanOrEqualTo(0)) {
        throw new Error('A quantidade de metal deve ser estritamente positiva.');
      }
    }
    this._grams = value.toDecimalPlaces(4);
  }

  get value(): number {
    return this._grams.toNumber();
  }

  get decimal(): Decimal {
    return this._grams;
  }

  isGreaterThan(other: MetalAmountVO | number | Decimal): boolean {
    const otherDecimal = other instanceof MetalAmountVO ? other.decimal : new Decimal(other);
    return this._grams.greaterThan(otherDecimal);
  }

  isGreaterThanOrEqualTo(other: MetalAmountVO | number | Decimal): boolean {
    const otherDecimal = other instanceof MetalAmountVO ? other.decimal : new Decimal(other);
    return this._grams.greaterThanOrEqualTo(otherDecimal);
  }

  isLessThan(other: MetalAmountVO | number | Decimal): boolean {
    const otherDecimal = other instanceof MetalAmountVO ? other.decimal : new Decimal(other);
    return this._grams.lessThan(otherDecimal);
  }

  isLessThanOrEqualTo(other: MetalAmountVO | number | Decimal): boolean {
    const otherDecimal = other instanceof MetalAmountVO ? other.decimal : new Decimal(other);
    return this._grams.lessThanOrEqualTo(otherDecimal);
  }

  plus(other: MetalAmountVO | number | Decimal): MetalAmountVO {
    const otherDecimal = other instanceof MetalAmountVO ? other.decimal : new Decimal(other);
    return new MetalAmountVO(this._grams.plus(otherDecimal), true);
  }

  minus(other: MetalAmountVO | number | Decimal): MetalAmountVO {
    const otherDecimal = other instanceof MetalAmountVO ? other.decimal : new Decimal(other);
    const result = this._grams.minus(otherDecimal);
    if (result.isNegative()) {
      throw new Error('O saldo resultante em gramas não pode ser negativo.');
    }
    return new MetalAmountVO(result, true);
  }

  toNegative(): Decimal {
    return this._grams.negated();
  }

  multiply(price: Decimal | number): Decimal {
    return this._grams.times(price).toDecimalPlaces(2);
  }
}
