import { InvalidArgumentError } from "../errors/invalid-argument.error";

export class TelefoneVO {
  private readonly _numero: string; // Armazena apenas dígitos

  constructor(numero: string) {
    if (!numero) {
      throw new InvalidArgumentError("Número de telefone não pode ser vazio.");
    }
    const numeroLimpo = numero.replace(/\D/g, "");
    // Validação simples de tamanho (ex: entre 10 e 11 dígitos para Brasil)
    if (numeroLimpo.length < 10 || numeroLimpo.length > 11) {
      throw new InvalidArgumentError(`Número de telefone inválido: ${numero}`);
    }
    this._numero = numeroLimpo;
  }

  get valor(): string {
    return this._numero;
  }

  // Pode adicionar métodos de formatação se necessário
  get formatadoDDD(): string {
    return `(${this._numero.substring(0, 2)}) ${this._numero.substring(2)}`;
  }

  public ehIgual(outro: TelefoneVO): boolean {
    return this.valor === outro.valor;
  }
}