import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReceiveInstallmentPaymentForm } from './ReceiveInstallmentPaymentForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface SaleInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
  accountRec?: {
    transacoes?:
      | {
          contaCorrente?: {
            nome: string;
          } | null;
        }[]
      | null;
  } | null;
}

interface InstallmentListProps {
  installments: SaleInstallment[];
  saleId: string; // Add saleId prop
  onInstallmentPaid: () => void; // Add onInstallmentPaid prop
}

export function InstallmentList({ installments, saleId }: InstallmentListProps) {
  if (!installments || installments.length === 0) {
    return <p>Nenhuma parcela encontrada para esta venda.</p>;
  }

  const getStatusBadge = (status: SaleInstallment['status']) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-500">Paga</Badge>;
      case 'PENDING':
        return <Badge variant="default" className="bg-orange-500">Pendente</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Atrasada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-2">Parcelas</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Pagamento</TableHead>
            <TableHead>Conta Pagamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((installment) => {
            const correctedStatus = installment.paidAt ? 'PAID' : installment.status;
            const paymentAccountName =
              installment.accountRec?.transacoes?.[0]?.contaCorrente?.nome || '-';

            return (
              <TableRow key={installment.id}>
                <TableCell>{installment.installmentNumber}</TableCell>
                <TableCell>
                  {parseFloat(installment.amount as any).toFixed(2)}
                </TableCell>
                <TableCell>
                  {new Date(installment.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{getStatusBadge(correctedStatus)}</TableCell>
                <TableCell>
                  {installment.paidAt
                    ? new Date(installment.paidAt).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>{paymentAccountName}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
