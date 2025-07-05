'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Transacao {
  id: string;
  tipo: 'CREDITO' | 'DEBITO';
  valor: number;
  moeda: string;
  dataHora: string;
  descricao?: string;
  contaContabil: { nome: string };
}

interface ExtratoData {
  contaCorrente: { numeroConta: string; saldo: number; moeda: string };
  saldoAnterior: number;
  transacoes: Transacao[];
  saldoFinal: number;
}

export default function ContaCorrenteExtractPage() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const [extractData, setExtractData] = useState<ExtratoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (!loading && user && id) {
      fetchExtract();
    }
  }, [user, loading, id, startDate, endDate]);

  const fetchExtract = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await api.get(`/contas-correntes/${id}/extrato?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setExtractData({
        ...response.data,
        saldoAnterior: parseFloat(response.data.saldoAnterior),
        saldoFinal: parseFloat(response.data.saldoFinal),
        transacoes: response.data.transacoes.map((t: any) => ({
          ...t,
          valor: parseFloat(t.valor),
        })),
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view the extract.</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extrato da Conta Corrente: {extractData?.contaCorrente.numeroConta}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <div>
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="endDate">Data Final</Label>
            <Input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button onClick={fetchExtract}>Filtrar</Button>
        </div>

        {extractData && (
          <div className="mb-4">
            <p><strong>Saldo Anterior ao Período:</strong> {extractData.saldoAnterior.toFixed(2)} {extractData.contaCorrente.moeda}</p>
          </div>
        )}

        <Table className="border border-border">
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Conta Contábil</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extractData?.transacoes.map((transacao) => (
              <TableRow key={transacao.id}>
                <TableCell>{new Date(transacao.dataHora).toLocaleString()}</TableCell>
                <TableCell>{transacao.descricao}</TableCell>
                <TableCell>{transacao.contaContabil.nome}</TableCell>
                <TableCell>{transacao.tipo}</TableCell>
                <TableCell className={transacao.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}>
                  {transacao.valor.toFixed(2)} {transacao.moeda}
                </TableCell>
              </TableRow>
            ))}
            {extractData?.transacoes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Nenhuma transação encontrada para o período.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {extractData && (
          <div className="mt-4">
            <p><strong>Saldo Final do Período:</strong> {extractData.saldoFinal.toFixed(2)} {extractData.contaCorrente.moeda}</p>
          </div>
        )}

        <div className="mt-4">
          <Link href={`/contas-correntes/${id}`}>
            <Button variant="outline">Voltar para Detalhes da Conta</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
