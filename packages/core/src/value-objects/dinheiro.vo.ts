import { InvalidArgumentError } from '../errors/invalid-argument.error';

export class Dinheiro {
  private readonly _quantia: number;
  private readonly _moeda: string;

  constructor(quantia: number, moeda: string = 'BRL') {
    if (typeof quantia !== 'number' || isNaN(quantia)) {
      throw new InvalidArgumentError('Quantia monetária deve ser um número.');
    }
    // Arredonda para 2 casas decimais para evitar problemas de precisão com float
    this._quantia = parseFloat(quantia.toFixed(2));
    this._moeda = moeda;
  }

  get quantia(): number { return this._quantia; }
  get moeda(): string { return this._moeda; }

  public adicionar(outro: Dinheiro): Dinheiro {
    if (this.moeda !== outro.moeda) {
      throw new InvalidArgumentError('Não é possível adicionar valores de moedas diferentes.');
    }
    return new Dinheiro(this.quantia + outro.quantia, this.moeda);
  }

  public subtrair(outro: Dinheiro): Dinheiro {
    if (this.moeda !== outro.moeda) {
      throw new InvalidArgumentError('Não é possível subtrair valores de moedas diferentes.');
    }
    return new Dinheiro(this.quantia - outro.quantia, this.moeda);
  }

  public ehZero(): boolean {
    return this.quantia === 0;
  }

  public static ZERO(moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(0, moeda);
  }

  public toJSON(): { quantia: number; moeda: string } {
    return {
      quantia: this.quantia,
      moeda: this.moeda,
    };
  }

}