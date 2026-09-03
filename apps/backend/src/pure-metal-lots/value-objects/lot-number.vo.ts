export class LotNumberVO {
  private readonly _value: string;

  constructor(value: string | number) {
    const raw = String(value).trim();
    if (!raw) {
      throw new Error('O número do lote não pode ser vazio.');
    }
    this._value = raw;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  static fromSequence(sequenceNumber: number, prefix: string = 'LMP'): LotNumberVO {
    if (sequenceNumber <= 0) {
      throw new Error('O número sequencial deve ser maior que zero.');
    }
    const formatted = `${prefix}-${String(sequenceNumber).padStart(6, '0')}`;
    return new LotNumberVO(formatted);
  }
}
