import { TipoMetal } from '@prisma/client';

export class MetalTypeVO {
  private readonly _value: TipoMetal;

  private static readonly VALID_METALS = Object.values(TipoMetal);

  constructor(value: string | TipoMetal) {
    const upper = (value || '').toString().toUpperCase() as TipoMetal;
    if (!MetalTypeVO.VALID_METALS.includes(upper)) {
      throw new Error(`Tipo de metal '${value}' inválido. Válidos: ${MetalTypeVO.VALID_METALS.join(', ')}`);
    }
    this._value = upper;
  }

  get value(): TipoMetal {
    return this._value;
  }

  equals(other: MetalTypeVO | string): boolean {
    const otherVal = other instanceof MetalTypeVO ? other.value : other.toUpperCase();
    return this._value === otherVal;
  }
}
