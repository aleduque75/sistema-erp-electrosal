export class EmailVO {
  private readonly _value: string;

  constructor(email: string) {
    if (!email || typeof email !== 'string') {
      throw new Error('E-mail é obrigatório.');
    }

    const clean = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(clean)) {
      throw new Error(`Formato de e-mail inválido: "${email}".`);
    }

    this._value = clean;
  }

  get value(): string {
    return this._value;
  }
}
