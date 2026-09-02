import { SaleItemEntity } from './sale-item.entity';
import { BadRequestException } from '@nestjs/common';

describe('SaleItemEntity', () => {
  it('should create a valid SaleItemEntity and calculate subtotal and total cost', () => {
    const item = new SaleItemEntity({
      productId: 'prod-1',
      quantity: 5,
      price: 100,
      costPriceAtSale: 40,
    });

    expect(item.id).toBeDefined();
    expect(item.productId).toBe('prod-1');
    expect(item.quantity).toBe(5);
    expect(item.price).toBe(100);
    expect(item.costPriceAtSale).toBe(40);
    expect(item.subtotal()).toBe(500);
    expect(item.totalCost()).toBe(200);
  });

  it('should throw BadRequestException if quantity <= 0', () => {
    expect(
      () =>
        new SaleItemEntity({
          productId: 'prod-1',
          quantity: 0,
          price: 100,
        }),
    ).toThrow(BadRequestException);

    expect(
      () =>
        new SaleItemEntity({
          productId: 'prod-1',
          quantity: -2,
          price: 100,
        }),
    ).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if price < 0', () => {
    expect(
      () =>
        new SaleItemEntity({
          productId: 'prod-1',
          quantity: 1,
          price: -10,
        }),
    ).toThrow(BadRequestException);
  });

  it('should update quantity and price with valid values', () => {
    const item = new SaleItemEntity({
      productId: 'prod-1',
      quantity: 2,
      price: 50,
    });

    item.updateQuantity(10);
    expect(item.quantity).toBe(10);
    expect(item.subtotal()).toBe(500);

    item.updatePrice(75);
    expect(item.price).toBe(75);
    expect(item.subtotal()).toBe(750);
  });

  it('should throw when updating quantity <= 0 or price < 0', () => {
    const item = new SaleItemEntity({
      productId: 'prod-1',
      quantity: 2,
      price: 50,
    });

    expect(() => item.updateQuantity(0)).toThrow(BadRequestException);
    expect(() => item.updatePrice(-1)).toThrow(BadRequestException);
  });
});
