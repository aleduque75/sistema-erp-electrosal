import { RawMaterialItemEntity } from './raw-material-item.entity';

describe('RawMaterialItemEntity', () => {
  it('should create valid raw material item', () => {
    const item = RawMaterialItemEntity.create({
      organizationId: 'org-1',
      rawMaterialId: 'mat-1',
      quantity: 5,
      cost: 150,
      goldEquivalentCost: 0.5,
      rawMaterialName: 'Ácido Nítrico',
    });

    expect(item.quantity).toBe(5);
    expect(item.cost.toNumber()).toBe(150);
    expect(item.goldEquivalentCost?.toNumber()).toBe(0.5);
    expect(item.rawMaterialName).toBe('Ácido Nítrico');
  });

  it('should throw error for invalid quantity or negative cost', () => {
    expect(() =>
      RawMaterialItemEntity.create({
        organizationId: 'org-1',
        rawMaterialId: 'mat-1',
        quantity: 0,
        cost: 150,
      }),
    ).toThrow('A quantidade de matéria-prima deve ser estritamente positiva.');

    expect(() =>
      RawMaterialItemEntity.create({
        organizationId: 'org-1',
        rawMaterialId: 'mat-1',
        quantity: 5,
        cost: -10,
      }),
    ).toThrow('O custo da matéria-prima não pode ser negativo.');
  });
});
