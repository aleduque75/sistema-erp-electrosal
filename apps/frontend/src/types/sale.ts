import { Transacao } from './transacao';
import { Pessoa } from '../@types/pessoa';

export interface InventoryLot {
  id: string;
  remainingQuantity: number;
  sourceType: string;
  batchNumber?: string;
  costPrice: number;
  receivedDate: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  inventoryLots: InventoryLot[];
  productGroup?: {
    id: string;
    name: string;
    isReactionProductGroup: boolean;
  };
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: { name: string; goldValue?: number };
  inventoryLotId?: string;
  laborPercentage?: number;
  entryUnit?: string;
  entryQuantity?: number;
  stock?: number;
  name?: string; // NewSaleForm uses .name in its items
}

export interface SaleItemLot {
  inventoryLotId: string;
  quantity: number;
}

export interface SaleInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
}

export interface PaymentTerm {
  id: string;
  name: string;
  installmentsDays: number[];
}

export type SaleStatus = 'PENDENTE' | 'CONFIRMADO' | 'A_SEPARAR' | 'SEPARADO' | 'FINALIZADO' | 'CANCELADO' | 'PAGO_PARCIALMENTE';

export interface Sale {
  id: string;
  orderNumber: number;
  pessoa: Pessoa; // Assuming Pessoa interface is imported
  totalAmount: number;
  feeAmount?: number;
  netAmount: number;
  goldPrice?: number;
  goldValue?: number;
  paymentMethod?: string;
  createdAt: string;
  status: SaleStatus;
  lucro?: number;
  salespersonId?: string;
  commissionAmount?: number;
  paymentAccountName?: string;
  adjustment?: {
    netDiscrepancyGrams: number;
    paymentReceivedBRL: number;
    paymentEquivalentGrams?: number;
    saleExpectedGrams?: number;
    grossDiscrepancyGrams?: number;
    costsInBRL?: number;
    costsInGrams?: number;
    laborCostGrams?: number;
    laborCostBRL?: number;
    totalCostBRL?: number;
    grossProfitBRL?: number;
    otherCostsBRL?: number;
    commissionBRL?: number;
    netProfitBRL?: number;
    paymentQuotation?: number;
  };
  accountsRec?: {
    id: string;
    amount: number;
    description: string;
    received: boolean;
    receivedAt: string | null;
    transacao?: Transacao & { contaCorrente?: { nome: string }; sale?: { goldPrice?: number } };
  }[];
  saleItems?: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: { name: string; goldValue?: number };
    inventoryLotId?: string;
    laborPercentage?: number;
  }[];
  installments?: SaleInstallment[];
  paymentTerm?: PaymentTerm;
}