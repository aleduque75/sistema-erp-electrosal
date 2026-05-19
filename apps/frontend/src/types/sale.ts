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

export interface SaleItemLot {
  id: string;
  saleItemId: string;
  inventoryLotId: string;
  quantity: number;
  inventoryLot?: InventoryLot;
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
  name?: string;
  saleItemLots?: SaleItemLot[];
}

export interface SaleInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
  accountRec?: {
    id: string;
    received: boolean;
    receivedAt: string | null;
    amount: number;
    amountPaid: number;
    goldAmount?: number;
    goldAmountPaid?: number;
    description: string;
    dueDate: string;
    contaCorrente?: { nome: string } | null;
    transacoes?: (Transacao & { contaCorrente?: { nome: string }; sale?: { goldPrice?: number }; contaContabil?: { nome: string } })[];
  } | null;
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
  pessoa: Pessoa;
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
    totalCostGrams?: number;
  };
  accountsRec?: {
    id: string;
    amount: number;
    description: string;
    received: boolean;
    receivedAt: string | null;
    amountPaid?: number;
    goldAmount?: number;
    goldAmountPaid?: number;
    dueDate: string;
    contaCorrente?: { nome: string } | null;
    transacoes?: (Transacao & { contaCorrente?: { nome: string }; sale?: { goldPrice?: number }; contaContabil?: { nome: string } })[];
  }[];
  saleItems?: SaleItem[];
  installments?: SaleInstallment[];
  paymentTerm?: PaymentTerm;
  observation?: string;
}