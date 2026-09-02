import { OrderNumberVO } from './order-number.vo';

describe('OrderNumberVO', () => {
  it('should accept valid order number', () => {
    const vo = new OrderNumberVO('REC-2026-001');
    expect(vo.value).toBe('REC-2026-001');
  });

  it('should throw error when empty', () => {
    expect(() => new OrderNumberVO('')).toThrow('Número da ordem de recuperação é obrigatório.');
  });

  it('should correctly compare order numbers case-insensitively', () => {
    const vo = new OrderNumberVO('rec-01');
    expect(vo.equals('REC-01')).toBe(true);
  });
});
