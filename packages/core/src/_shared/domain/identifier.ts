/**
 * A classe base para identificadores, garantindo a comparação baseada em valor.
 * @template T - O tipo do valor do identificador (string, number, etc.).
 */
export class Identifier<T> {
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * Compara a igualdade com outro Identifier.
   * @param id - O identificador a ser comparado.
   * @returns `true` se os valores forem iguais, `false` caso contrário.
   */
  public equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof this.constructor)) {
      return false;
    }
    return id.toValue() === this.value;
  }

  /**
   * Retorna o valor do identificador como uma string.
   */
  public toString(): string {
    return String(this.value);
  }

  /**
   * Retorna o valor primitivo do identificador.
   * Útil para serialização ou persistência.
   */
  public toValue(): T {
    return this.value;
  }
}
