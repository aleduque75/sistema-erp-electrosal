import { ProductEntity } from './product.entity';
import { StockUnit } from '@prisma/client';

describe('ProductEntity', () => {
  const validProps = {
    organizationId: 'org-1',
    name: 'Ouro 24k Fino',
    price: 350.5,
    costPrice: 300,
    stock: 100,
    stockUnit: StockUnit.GRAMS,
  };

  it('should create a valid ProductEntity', () => {
    const product = ProductEntity.create(validProps);

    expect(product.name).toBe('Ouro 24k Fino');
    expect(product.price).toBe(350.5);
    expect(product.costPrice).toBe(300);
    expect(product.stock).toBe(100);
    expect(product.stockUnit).toBe(StockUnit.GRAMS);
  });

  it('should throw error when organizationId is missing', () => {
    expect(() =>
      ProductEntity.create({ ...validProps, organizationId: '' }),
    ).toThrow('A organização é obrigatória');
  });

  it('should throw error when name is missing', () => {
    expect(() =>
      ProductEntity.create({ ...validProps, name: '   ' }),
    ).toThrow('O nome é obrigatório');
  });

  it('should throw error when price is negative', () => {
    expect(() =>
      ProductEntity.create({ ...validProps, price: -10 }),
    ).toThrow('O preço do produto não pode ser negativo');
  });

  it('should adjust stock correctly', () => {
    const product = ProductEntity.create(validProps);
    product.adjustStock(50);
    expect(product.stock).toBe(150);

    product.adjustStock(-30);
    expect(product.stock).toBe(120);
  });

  it('should update details and price', () => {
    const product = ProductEntity.create(validProps);
    product.updateDetails({
      name: 'Ouro 24k Mil',
      description: 'Barra pura',
    });
    expect(product.name).toBe('Ouro 24k Mil');
    expect(product.description).toBe('Barra pura');

    product.updatePrice(400);
    expect(product.price).toBe(400);
  });
});
