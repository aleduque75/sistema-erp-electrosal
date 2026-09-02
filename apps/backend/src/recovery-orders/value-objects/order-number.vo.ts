export class OrderNumberVO {
  private readonly _value: string;

  constructor(orderNumber: string | number) {
    const str = (orderNumber ?? '').toString().trim();
    if (!str) {
      throw new Error('Número da ordem de recuperação é obrigatório.');
    }
    if (str.length > 50) {
      throw new Error('Número da ordem de recuperação excede o tamanho máximo de 50 caracteres.');
    }
    this._value = str;
  }

  get value(): string {
    return this._value;
  }

  equals(other: OrderNumberVO | string): boolean {
    const otherVal = other instanceof OrderNumberVO ? other.value : (other ?? '').toString().trim();
    return this._value.toUpperCase() === otherVal.toUpperCase();
  }
}
