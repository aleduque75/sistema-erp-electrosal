import { Prisma } from '@prisma/client';
import { SaleEntity } from '../entities/sale.entity';
import { SaleItemMapper } from './sale-item.mapper';

export class SaleMapper {
  static toDomain(raw: any): SaleEntity {
    if (!raw) return null as any;

    const items = raw.saleItems ? raw.saleItems.map((item: any) => SaleItemMapper.toDomain(item)) : [];

    return new SaleEntity({
      id: raw.id,
      orderNumber: raw.orderNumber,
      organizationId: raw.organizationId,
      pessoaId: raw.pessoaId,
      status: raw.status,
      totalAmount: raw.totalAmount ? Number(raw.totalAmount) : 0,
      totalCost: raw.totalCost ? Number(raw.totalCost) : 0,
      netAmount: raw.netAmount ? Number(raw.netAmount) : 0,
      feeAmount: raw.feeAmount ? Number(raw.feeAmount) : 0,
      shippingCost: raw.shippingCost ? Number(raw.shippingCost) : 0,
      goldPrice: raw.goldPrice ? Number(raw.goldPrice) : null,
      goldValue: raw.goldValue ? Number(raw.goldValue) : null,
      paymentMethod: raw.paymentMethod,
      paymentTermId: raw.paymentTermId,
      readyForPayment: Boolean(raw.readyForPayment),
      observation: raw.observation,
      salespersonId: raw.salespersonId,
      commissionAmount: raw.commissionAmount ? Number(raw.commissionAmount) : null,
      commissionDetails: raw.commissionDetails,
      externalId: raw.externalId,
      items,
      accountsRec: raw.accountsRec || [],
      pessoa: raw.pessoa,
      salesperson: raw.salesperson,
      paymentTerm: raw.paymentTerm,
      adjustment: raw.adjustment,
      installments: raw.installments || [],
      createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
    });
  }

  static toPersistence(sale: SaleEntity): Prisma.SaleUncheckedCreateInput {
    return {
      id: sale.id,
      orderNumber: sale.orderNumber,
      organizationId: sale.organizationId,
      pessoaId: sale.pessoaId,
      status: sale.status.value,
      totalAmount: sale.totalAmount,
      totalCost: sale.totalCost,
      netAmount: sale.netAmount,
      feeAmount: sale.feeAmount,
      shippingCost: sale.shippingCost,
      goldPrice: sale.goldPrice,
      goldValue: sale.goldValue,
      paymentMethod: sale.paymentMethod,
      paymentTermId: sale.paymentTermId,
      readyForPayment: sale.readyForPayment,
      observation: sale.observation,
      salespersonId: sale.salespersonId,
      commissionAmount: sale.commissionAmount,
      commissionDetails: sale.commissionDetails,
      externalId: sale.externalId,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
  }

  static toResponseDto(sale: SaleEntity): any {
    return {
      id: sale.id,
      orderNumber: sale.orderNumber,
      organizationId: sale.organizationId,
      pessoaId: sale.pessoaId,
      status: sale.status.value,
      totalAmount: sale.totalAmount,
      totalCost: sale.totalCost,
      netAmount: sale.netAmount,
      feeAmount: sale.feeAmount,
      shippingCost: sale.shippingCost,
      goldPrice: sale.goldPrice,
      goldValue: sale.goldValue,
      paymentMethod: sale.paymentMethod,
      paymentTermId: sale.paymentTermId,
      readyForPayment: sale.readyForPayment,
      observation: sale.observation,
      salespersonId: sale.salespersonId,
      commissionAmount: sale.commissionAmount,
      commissionDetails: sale.commissionDetails,
      items: sale.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        costPriceAtSale: item.costPriceAtSale,
        subtotal: item.subtotal(),
        totalCost: item.totalCost(),
        laborPercentage: item.laborPercentage,
        product: item.product,
        saleItemLots: item.saleItemLots,
      })),
      accountsRec: sale.accountsRec,
      pessoa: sale.pessoa,
      salesperson: sale.salesperson,
      paymentTerm: sale.paymentTerm,
      adjustment: sale.adjustment,
      installments: sale.installments,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
  }
}
