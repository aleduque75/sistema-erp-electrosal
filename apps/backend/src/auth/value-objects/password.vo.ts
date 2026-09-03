import * as bcrypt from 'bcryptjs';

export class PasswordVO {
  private readonly _value: string;

  constructor(password: string) {
    if (!password || password.trim().length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }
    this._value = password;
  }

  get value(): string {
    return this._value;
  }

  async hash(saltRounds: number = 10): Promise<string> {
    return bcrypt.hash(this._value, saltRounds);
  }

  static async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword.trim(), hashedPassword);
  }
}
