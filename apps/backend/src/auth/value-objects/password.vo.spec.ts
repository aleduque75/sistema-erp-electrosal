import { PasswordVO } from './password.vo';

describe('PasswordVO', () => {
  it('should hash and compare passwords correctly', async () => {
    const vo = new PasswordVO('secret123');
    const hash = await vo.hash();

    expect(hash).toBeDefined();
    expect(await PasswordVO.compare('secret123', hash)).toBe(true);
    expect(await PasswordVO.compare('wrong', hash)).toBe(false);
  });

  it('should throw if password is too short', () => {
    expect(() => new PasswordVO('12345')).toThrow('A senha deve ter pelo menos 6 caracteres');
  });
});
