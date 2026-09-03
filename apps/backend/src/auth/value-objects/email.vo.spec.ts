import { EmailVO } from './email.vo';

describe('EmailVO', () => {
  it('should normalize and validate email', () => {
    const vo = new EmailVO('  User.Test@Electrosal.com.br  ');
    expect(vo.value).toBe('user.test@electrosal.com.br');
  });

  it('should throw on invalid email format', () => {
    expect(() => new EmailVO('invalid-email')).toThrow('Formato de e-mail inválido');
  });
});
