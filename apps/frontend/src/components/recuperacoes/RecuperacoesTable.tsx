import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RecuperacaoDto } from '@/types/recuperacao';
import { format } from 'date-fns';

interface RecuperacoesTableProps {
  recuperacoes: RecuperacaoDto[];
  onEdit?: (rec: RecuperacaoDto) => void;
  onDelete?: (rec: RecuperacaoDto) => void;
}

export function RecuperacoesTable({ recuperacoes, onEdit, onDelete }: RecuperacoesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperações</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recuperacoes.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{format(new Date(r.dataInicio), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{r.dataFim ? format(new Date(r.dataFim), 'dd/MM/yyyy') : '-'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => onEdit?.(r)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={() => onDelete?.(r)}>
                    Deletar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
