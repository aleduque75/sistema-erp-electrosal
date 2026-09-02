import { SaleEntity } from './sale.entity';
import { SaleItemEntity } from './sale-item.entity';
import { SaleStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('SaleEntity', () => {
  const createSampleItem = (id: string, price: number, quantity: number, cost = 10) =>
    new SaleItemEntity({
      id,
      productId: `prod-${id}`,
      price,
      quantity,
      costPriceAtSale: cost,
    });

  it('should initialize with PENDENTE status and calculate totals correctly', () => {
    const item1 = createSampleItem('1', 100, 2, 40); // subtotal = 200, cost = 80
    const item2 = createSampleItem('2', 50, 1, 20);  // subtotal = 50, cost = 20

    const sale = new SaleEntity({
      orderNumber: 1001,
      organizationId: 'org-1',
      pessoaId: 'client-1',
      items: [item1, item2],
      shippingCost: 30,
      feeAmount: 10,
    });

    expect(sale.id).toBeDefined();
    expect(sale.orderNumber).toBe(1001);
    expect(sale.status.value).toBe(SaleStatus.PENDENTE);
    expect(sale.totalAmount).toBe(250);
    expect(sale.totalCost).toBe(100);
    expect(sale.netAmount).toBe(290); // 250 + 30 (shipping) + 10 (fee)
  });

  it('should calculate gold equivalence correctly', () => {
    const item = createSampleItem('1', 1000, 1);
    const sale = new SaleEntity({
      orderNumber: 1002,
      organizationId: 'org-1',
      pessoaId: 'client-1',
      items: [item],
      goldPrice: 500,
    });

    expect(sale.netAmount).toBe(1000);
    expect(sale.goldValue).toBe(2); // 1000 / 500 = 2g
  });

  it('should add and remove items recalculating totals', () => {
    const sale = new SaleEntity({
      orderNumber: 1003,
      organizationId: 'org-1',
      pessoaId: 'client-1',
      items: [createSampleItem('1', 100, 1)],
    });

    expect(sale.totalAmount).toBe(100);

    sale.addItem(createSampleItem('2', 150, 2)); // +300
    expect(sale.items.length).toBe(2);
    expect(sale.totalAmount).toBe(400);

    sale.removeItem('1');
    expect(sale.items.length).toBe(1);
    expect(sale.totalAmount).toBe(300);
  });

  it('should transition through lifecycle: confirm, separate, finalize', () => {
    const sale = new SaleEntity({
      orderNumber: 1004,
      organizationId: 'org-1',
      pessoaId: 'client-1',
      items: [createSampleItem('1', 100, 1)],
    });

    expect(sale.status.isPendente()).toBe(true);

    sale.confirm();
    expect(sale.status.isConfirmado()).toBe(true);

    sale.separate();
    expect(sale.status.isSeparado()).toBe(true);

    sale.finalize();
    expect(sale.status.isFinalizado()).toBe(true);
  });

  it('should prevent finalizing an already cancelled sale', () => {
    const sale = new SaleEntity({
      orderNumber: 1005,
      organizationId: 'org-1',
      pessoaId: 'client-1',
      items: [createSampleItem('1', 100, 1)],
    });

    sale.cancel();
    expect(sale.status.isCancelado()).toBe(true);
    expect(() => sale.finalize()).toThrow(BadRequestException);
  });

  it('should update financials and observation', () => {
    const sale = new SaleEntity({
      orderNumber: 1006,
      organizationId: 'org-1',
      pessoaId: 'client-1',
      items: [createSampleItem('1', 500, 1)],
      shippingCost: 0,
      feeAmount: 0,
    });

    expect(sale.netAmount).toBe(500);

    sale.updateFinancials({ goldPrice: 250, feeAmount: 20, shippingCost: 30 });
    expect(sale.shippingCost).toBe(30);
    expect(sale.feeAmount).toBe(20);
    expect(sale.netAmount).toBe(550); // 500 + 30 + 20
    expect(sale.goldValue).toBe(2.2); // 550 / 250 = 2.2

    sale.updateObservation('Nota fiscal emitida');
    expect(sale.observation).toBe('Nota fiscal emitida');
  });
});
