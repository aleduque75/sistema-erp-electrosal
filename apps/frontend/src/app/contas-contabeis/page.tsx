'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
  contaPaiId?: string;
}

export default function ContasContabeisPage() {
  const { user, loading } = useAuth();
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchContasContabeis();
    }
  }, [user, loading]);

  const fetchContasContabeis = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get('/contas-contabeis', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setContasContabeis(response.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      await api.delete(`/contas-contabeis/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setContasContabeis(contasContabeis.filter((conta) => conta.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view accounting accounts.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas Contábeis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Link href="/contas-contabeis/create">
            <Button>Criar Nova Conta Contábil</Button>
          </Link>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <Table className="border border-border">
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Aceita Lançamento</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contasContabeis.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell>{conta.codigo}</TableCell>
                <TableCell>{conta.nome}</TableCell>
                <TableCell>{conta.tipo}</TableCell>
                <TableCell>{conta.aceitaLancamento ? 'Sim' : 'Não'}</TableCell>
                <TableCell>
                  <Link href={`/contas-contabeis/${conta.id}`}>
                    <Button variant="link" className="mr-2">Visualizar</Button>
                  </Link>
                  <Link href={`/contas-contabeis/${conta.id}/edit`}>
                    <Button variant="link" className="mr-2">Editar</Button>
                  </Link>
                  <Button variant="destructive" onClick={() => handleDelete(conta.id)}>
                    Excluir
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
