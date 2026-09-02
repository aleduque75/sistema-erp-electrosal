import { ProductMapper, PrismaProductWithRelations } from './product.mapper';
import { Prisma, StockUnit, SaleAdjustmentCalcMethod } from '@prisma/client';

describe('ProductMapper', () => {
  const mockPrismaProduct: PrismaProductWithRelations = {
    id: 'prod-1',
    organizationId: 'org-1',
    name: 'Ouro 18k',
    description: 'Liga nobre',
    price: new Prisma.Decimal('280.00'),
    costPrice: new Prisma.Decimal('220.00'),
    stock: 50.5,
    stockUnit: StockUnit.GRAMS,
    goldValue: 18,
    productGroupId: 'group-1',
    externalId: 'ext-123',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    productGroup: {
      id: 'group-1',
      organizationId: 'org-1',
      name: 'Ligas',
      description: null,
      commissionPercentage: null,
      isReactionProductGroup: false,
      adjustmentCalcMethod: SaleAdjustmentCalcMethod.QUANTITY_BASED,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    inventoryLots: [
      {
        id: 'lot-1',
        lotNumber: 'LOTE-001',
        productId: 'prod-1',
        initialQuantity: 100,
        remainingQuantity: 50.5,
        unitCost: new Prisma.Decimal('220.00'),
        sourceType: 'COMPRA',
        sourceId: 'src-1',
        notes: null,
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ],
  };

  it('should map PrismaProductWithRelations to ProductEntity', () => {
    const entity = ProductMapper.toDomain(mockPrismaProduct);

    expect(entity.id).toBe('prod-1');
    expect(entity.organizationId).toBe('org-1');
    expect(entity.name).toBe('Ouro 18k');
    expect(entity.price).toBe(280);
    expect(entity.costPrice).toBe(220);
    expect(entity.stock).toBe(50.5);
    expect(entity.stockUnit).toBe(StockUnit.GRAMS);
    expect(entity.productGroupId).toBe('group-1');
    expect(entity.productGroup.name).toBe('Ligas');
    expect(entity.inventoryLots).toHaveLength(1);
  });

  it('should map ProductEntity to response DTO format', () => {
    const entity = ProductMapper.toDomain(mockPrismaProduct);
    const dto = ProductMapper.toResponseDto(entity);

    expect(dto.id).toBe('prod-1');
    expect(dto.name).toBe('Ouro 18k');
    expect(dto.price).toBe(280);
    expect(dto.productGroup).toBeDefined();
    expect(dto.inventoryLots).toHaveLength(1);
  });
});
