"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

type SortKey = keyof AccountRec;

export function AccountsReceivableTable({ accountsRec }: AccountsReceivableTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

  const sortedAccountsRec = useMemo(() => {
    let sortableItems = [...accountsRec];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        // Handle null/undefined values by placing them at the end (or beginning, depending on direction)
        if (valA === null || valA === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (valB === null || valB === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;

        // Type-aware comparison
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // For numbers, booleans, or mixed types where direct comparison is generally fine
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [accountsRec, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => requestSort('amount')}>
                Valor
                {getSortIndicator('amount')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => requestSort('dueDate')}>
                Vencimento
                {getSortIndicator('dueDate')}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAccountsRec.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhuma conta a receber encontrada.
              </TableCell>
            </TableRow>
          ) : (
            sortedAccountsRec.map((account) => (
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
