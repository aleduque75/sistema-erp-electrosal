'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ContaCorrente {
  id: string;
  numeroConta: string;
  saldo: number;
  moeda: string;
  dataAbertura: string;
}

export default function ContaCorrenteDetailPage() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const [conta, setConta] = useState<ContaCorrente | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && id) {
      fetchContaCorrente();
    }
  }, [user, loading, id]);

  const fetchContaCorrente = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/contas-correntes/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setConta({
        ...response.data,
        saldo: parseFloat(response.data.saldo),
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view current account details.</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!conta) {
    return <p>Conta Corrente não encontrada.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes da Conta Corrente</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Número da Conta:</strong> {conta.numeroConta}</p>
        <p><strong>Saldo:</strong> {conta.saldo.toFixed(2)} {conta.moeda}</p>
        <p><strong>Data de Abertura:</strong> {new Date(conta.dataAbertura).toLocaleDateString()}</p>
        <div className="mt-4 flex space-x-2">
          <Link href={`/contas-correntes/${conta.id}/edit`}>
            <Button>Editar Conta Corrente</Button>
          </Link>
          <Link href={`/contas-correntes/${conta.id}/extrato`}>
            <Button variant="secondary">Ver Extrato</Button>
          </Link>
          <Link href="/contas-correntes">
            <Button variant="outline">Voltar para Contas Correntes</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
