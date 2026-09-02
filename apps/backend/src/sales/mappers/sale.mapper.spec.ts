import { SaleMapper } from './sale.mapper';
import { SaleEntity } from '../entities/sale.entity';
import { SaleItemEntity } from '../entities/sale-item.entity';
import { SaleStatus } from '@prisma/client';

describe('SaleMapper', () => {
  const mockRawPrisma = {
    id: 'sale-123',
    orderNumber: 31750,
    organizationId: 'org-abc',
    pessoaId: 'client-xyz',
    status: SaleStatus.CONFIRMADO,
    totalAmount: '500.00',
    totalCost: '200.00',
    netAmount: '530.00',
    feeAmount: '10.00',
    shippingCost: '20.00',
    goldPrice: '400.00',
    goldValue: '1.325',
    paymentMethod: 'A_VISTA',
    observation: 'Cliente VIP',
    saleItems: [
      {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 2,
        price: '250.00',
        costPriceAtSale: '100.00',
      },
    ],
  };

  it('should map from raw Prisma to SaleEntity (toDomain)', () => {
    const entity = SaleMapper.toDomain(mockRawPrisma);

    expect(entity).toBeInstanceOf(SaleEntity);
    expect(entity.id).toBe('sale-123');
    expect(entity.orderNumber).toBe(31750);
    expect(entity.status.value).toBe(SaleStatus.CONFIRMADO);
    expect(entity.totalAmount).toBe(500);
    expect(entity.shippingCost).toBe(20);
    expect(entity.feeAmount).toBe(10);
    expect(entity.netAmount).toBe(530);
    expect(entity.items.length).toBe(1);
    expect(entity.items[0].subtotal()).toBe(500);
  });

  it('should map from SaleEntity to Prisma persistence input (toPersistence)', () => {
    const entity = SaleMapper.toDomain(mockRawPrisma);
    const persistence = SaleMapper.toPersistence(entity);

    expect(persistence.id).toBe('sale-123');
    expect(persistence.orderNumber).toBe(31750);
    expect(persistence.status).toBe(SaleStatus.CONFIRMADO);
    expect(persistence.totalAmount).toBe(500);
    expect(persistence.netAmount).toBe(530);
    expect(persistence.observation).toBe('Cliente VIP');
  });

  it('should map from SaleEntity to response DTO (toResponseDto)', () => {
    const entity = SaleMapper.toDomain(mockRawPrisma);
    const dto = SaleMapper.toResponseDto(entity);

    expect(dto.id).toBe('sale-123');
    expect(dto.orderNumber).toBe(31750);
    expect(dto.status).toBe(SaleStatus.CONFIRMADO);
    expect(dto.totalAmount).toBe(500);
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0].subtotal).toBe(500);
    expect(dto.items[0].totalCost).toBe(200);
  });

  it('should return null when raw data is null/undefined in toDomain', () => {
    expect(SaleMapper.toDomain(null)).toBeNull();
    expect(SaleMapper.toDomain(undefined)).toBeNull();
  });
});
