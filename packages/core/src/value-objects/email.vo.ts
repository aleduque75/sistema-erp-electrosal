import { InvalidArgumentError } from '../errors/invalid-argument.error';

export class EmailVO {
  private readonly _valor: string;

  constructor(valor: string) {
    if (!EmailVO.isValid(valor)) {
      throw new InvalidArgumentError(`E-mail inválido: ${valor}`);
    }
    this._valor = valor.toLowerCase();
  }

  get valor(): string {
    return this._valor;
  }

  public static isValid(email: string): boolean {
    if (!email) return false;
    // Regex simples para validação de e-mail (pode ser mais robusta)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public ehIgual(outro: EmailVO): boolean {
    return this.valor === outro.valor;
  }
}