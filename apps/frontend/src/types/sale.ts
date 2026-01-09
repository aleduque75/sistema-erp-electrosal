import { Transacao } from './transacao';
import { Pessoa } from './pessoa'; // Assuming Pessoa interface exists

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
  status: 'PENDENTE' | 'CONFIRMADO' | 'A_SEPARAR' | 'SEPARADO' | 'FINALIZADO' | 'CANCELADO';
  lucro?: number;
  salespersonId?: string;
  commissionAmount?: number;
  paymentAccountName?: string;
  adjustment?: {
    netDiscrepancyGrams: number;
    paymentReceivedBRL: number;
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