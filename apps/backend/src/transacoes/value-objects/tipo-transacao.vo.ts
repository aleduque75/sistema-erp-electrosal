import { TipoTransacaoPrisma } from '@prisma/client';

export class TipoTransacaoVO {
  private readonly _value: TipoTransacaoPrisma;

  private constructor(value: TipoTransacaoPrisma) {
    this._value = value;
  }

  static create(value: string | TipoTransacaoPrisma): TipoTransacaoVO {
    const normalized = String(value || '').toUpperCase().trim();
    if (normalized !== TipoTransacaoPrisma.CREDITO && normalized !== TipoTransacaoPrisma.DEBITO) {
      throw new Error(`Tipo de transação inválido: "${value}". Valores permitidos: CREDITO, DEBITO.`);
    }
    return new TipoTransacaoVO(normalized as TipoTransacaoPrisma);
  }

  get value(): TipoTransacaoPrisma {
    return this._value;
  }

  isCredito(): boolean {
    return this._value === TipoTransacaoPrisma.CREDITO;
  }

  isDebito(): boolean {
    return this._value === TipoTransacaoPrisma.DEBITO;
  }

  toString(): string {
    return this._value;
  }
}
