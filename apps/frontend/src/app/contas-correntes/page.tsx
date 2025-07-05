'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ContaCorrente {
  id: string;
  numeroConta: string;
  saldo: number;
  moeda: string;
  dataAbertura: string;
}

export default function ContasCorrentesPage() {
  const { user, loading } = useAuth();
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchContasCorrentes();
    }
  }, [user, loading]);

  const fetchContasCorrentes = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get('/contas-correntes', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setContasCorrentes(response.data.map((conta: any) => ({
        ...conta,
        saldo: parseFloat(conta.saldo),
      })));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      await api.delete(`/contas-correntes/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setContasCorrentes(contasCorrentes.filter((conta) => conta.id !== id));
      toast.success('Conta corrente excluída com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro ao excluir a conta corrente.');
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view current accounts.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas Correntes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Link href="/contas-correntes/create">
            <Button>Criar Nova Conta Corrente</Button>
          </Link>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <Table className="border border-border">
          <TableHeader>
            <TableRow>
              <TableHead>Número da Conta</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Moeda</TableHead>
              <TableHead>Data de Abertura</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contasCorrentes.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell>{conta.numeroConta}</TableCell>
                <TableCell>{conta.saldo.toFixed(2)}</TableCell>
                <TableCell>{conta.moeda}</TableCell>
                <TableCell>{new Date(conta.dataAbertura).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Link href={`/contas-correntes/${conta.id}`}>
                    <Button variant="link" className="mr-2">Visualizar</Button>
                  </Link>
                  <Link href={`/contas-correntes/${conta.id}/edit`}>
                    <Button variant="link" className="mr-2">Editar</Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Excluir</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente esta conta corrente e todos os lançamentos associados a ela.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(conta.id)}>Continuar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}