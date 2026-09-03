import { LotNumberVO } from './lot-number.vo';

describe('LotNumberVO', () => {
  it('should instantiate correctly with valid string', () => {
    const vo = new LotNumberVO('LMP-000001');
    expect(vo.value).toBe('LMP-000001');
    expect(vo.toString()).toBe('LMP-000001');
  });

  it('should throw error when empty', () => {
    expect(() => new LotNumberVO('')).toThrow('O número do lote não pode ser vazio.');
    expect(() => new LotNumberVO('   ')).toThrow('O número do lote não pode ser vazio.');
  });

  it('should format from sequence correctly', () => {
    const vo = LotNumberVO.fromSequence(42);
    expect(vo.value).toBe('LMP-000042');
  });

  it('should throw when sequence is <= 0', () => {
    expect(() => LotNumberVO.fromSequence(0)).toThrow('O número sequencial deve ser maior que zero.');
    expect(() => LotNumberVO.fromSequence(-5)).toThrow('O número sequencial deve ser maior que zero.');
  });
});
