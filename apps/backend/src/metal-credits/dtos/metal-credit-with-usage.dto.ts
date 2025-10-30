import { MetalCredit } from '@sistema-erp-electrosal/core';
import { MetalCreditWithClientNameDto } from './metal-credit-with-client-name.dto';

export interface SaleUsageDto {
  id: string;
  orderNumber: number;
  saleDate: Date; // From Sale.createdAt
  totalAmount: number; // Sale.totalAmount
}

export interface MetalAccountEntryDto {
  id: string;
  date: Date;
  description: string;
  grams: number;
  type: string;
  sourceId?: string;
  sale?: SaleUsageDto; // If type is SALE_PAYMENT
  paymentDate?: Date;
  paymentValueBRL?: number;
  paymentQuotation?: number;
  paymentSourceAccountName?: string;
  isPaid?: boolean;
}

export interface MetalCreditWithUsageDto extends MetalCreditWithClientNameDto {
  usageEntries: MetalAccountEntryDto[];
}
