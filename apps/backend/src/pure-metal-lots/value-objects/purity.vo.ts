import Decimal from 'decimal.js';

export class PurityVO {
  private readonly _value: Decimal;

  constructor(purity: number | string | Decimal) {
    const dec = new Decimal(purity);
    if (dec.isNaN() || !dec.isFinite()) {
      throw new Error('Teor químico inválido.');
    }
    if (dec.lessThanOrEqualTo(0) || dec.greaterThan(1)) {
      throw new Error('O teor químico deve ser um valor decimal estritamente entre 0 e 1 (ex: 0.9999).');
    }
    this._value = dec.toDecimalPlaces(4);
  }

  get value(): number {
    return this._value.toNumber();
  }

  get decimal(): Decimal {
    return this._value;
  }

  toPercentage(): number {
    return this._value.times(100).toDecimalPlaces(2).toNumber();
  }

  multiply(amount: number | Decimal): Decimal {
    const amountDec = amount instanceof Decimal ? amount : new Decimal(amount);
    return amountDec.times(this._value).toDecimalPlaces(4);
  }
}
