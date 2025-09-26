import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  received: boolean;
  receivedAt?: string | null;
  sale?: { id: string };
}

interface AccountsReceivableTableProps {
  accountsRec: AccountRec[];
}

export function AccountsReceivableTable({ accountsRec }: AccountsReceivableTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accountsRec.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhuma conta a receber encontrada.
              </TableCell>
            </TableRow>
          ) : (
            accountsRec.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.id}</TableCell>
                <TableCell>{account.description}</TableCell>
                <TableCell>{Number(account.amount).toFixed(2)}</TableCell>
                <TableCell>{format(new Date(account.dueDate), "dd/MM/yyyy")}</TableCell>
                <TableCell>{account.received ? "Recebido" : "A Receber"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
