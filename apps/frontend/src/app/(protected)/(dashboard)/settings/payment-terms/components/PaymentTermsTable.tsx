'use client';

import { PaymentTerm } from '../page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface PaymentTermsTableProps {
  paymentTerms: PaymentTerm[];
  onEdit: (term: PaymentTerm) => void;
}

export function PaymentTermsTable({ paymentTerms, onEdit }: PaymentTermsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Dias das Parcelas</TableHead>
          <TableHead>Taxa de Juros</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paymentTerms.map((term) => (
          <TableRow key={term.id}>
            <TableCell>{term.name}</TableCell>
            <TableCell>{term.description}</TableCell>
            <TableCell>{term.installmentsDays.join(', ')}</TableCell>
            <TableCell>{term.interestRate ? `${term.interestRate}%` : 'N/A'}</TableCell>
            <TableCell>
              <Button variant="outline" size="icon" onClick={() => onEdit(term)}>
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
