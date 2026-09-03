import { PureMetalLotStatusVO } from './pure-metal-lot-status.vo';
import { PureMetalLotStatus } from '@prisma/client';

describe('PureMetalLotStatusVO', () => {
  it('should construct valid statuses', () => {
    const available = new PureMetalLotStatusVO('AVAILABLE');
    expect(available.isAvailable()).toBe(true);
    expect(available.value).toBe(PureMetalLotStatus.AVAILABLE);

    const used = new PureMetalLotStatusVO(PureMetalLotStatus.USED);
    expect(used.isUsed()).toBe(true);

    const partiallyUsed = new PureMetalLotStatusVO('partially_used');
    expect(partiallyUsed.isPartiallyUsed()).toBe(true);
  });

  it('should throw on invalid status', () => {
    expect(() => new PureMetalLotStatusVO('INVALID')).toThrow('Status de lote de metal puro inválido');
  });

  it('should derive status correctly from grams', () => {
    expect(PureMetalLotStatusVO.fromGrams(100, 100).value).toBe(PureMetalLotStatus.AVAILABLE);
    expect(PureMetalLotStatusVO.fromGrams(100, 50).value).toBe(PureMetalLotStatus.PARTIALLY_USED);
    expect(PureMetalLotStatusVO.fromGrams(100, 0).value).toBe(PureMetalLotStatus.USED);
    expect(PureMetalLotStatusVO.fromGrams(100, -1).value).toBe(PureMetalLotStatus.USED);
  });
});
