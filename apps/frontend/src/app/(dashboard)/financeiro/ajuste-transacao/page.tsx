'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Transacao } from '@/types/transacao'; // Assumindo que você terá um tipo Transacao
import { ContaCorrente } from '@/types/conta-corrente'; // Assumindo que você terá um tipo ContaCorrente

import { Sale } from '@/types/sale'; // Importar o tipo Sale

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export default function AdjustTransactionPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);
  const [transactionToAdjust, setTransactionToAdjust] = useState<Transacao | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Dados para o formulário de ajuste
  const [contas, setContas] = useState<{ value: string; label: string }[]>([]);
  const [newContaCorrenteId, setNewContaCorrenteId] = useState('');
  const [newGoldAmount, setNewGoldAmount] = useState(0);
  const [newBRLAmount, setNewBRLAmount] = useState(0);

  useEffect(() => {
    const fetchContas = async () => {
      try {
        const response = await api.get('/contas-correntes');
        const options = response.data.map((c: ContaCorrente) => ({ value: c.id, label: c.nome }));
        setContas(options);
      } catch (error) {
        toast.error('Falha ao buscar contas correntes.');
      }
    };
    fetchContas();
  }, []);

  useEffect(() => {
    if (sale?.goldPrice) {
      const newBRL = newGoldAmount * sale.goldPrice;
      setNewBRLAmount(newBRL);
    }
  }, [newGoldAmount, sale]);

  const handleSearch = async () => {
    if (!orderNumber) {
      toast.error('Por favor, insira um número de pedido.');
      return;
    }
    setIsLoading(true);
    setSale(null);
    setTransactionToAdjust(null);
    try {
      const response = await api.get<Sale>(`/sales/by-order-number/${orderNumber}/transactions`);
      setSale(response.data);
    } catch (error) {
      toast.error('Pedido não encontrado ou falha ao buscar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTransaction = (transacao: Transacao) => {
    setTransactionToAdjust(transacao);
    setNewContaCorrenteId(transacao.contaCorrenteId || '');
    setNewGoldAmount(transacao.goldAmount || 0);
  };

  const handleAdjust = async () => {
    if (!transactionToAdjust || !newContaCorrenteId || newGoldAmount <= 0) {
      toast.error('Por favor, preencha todos os campos para o ajuste.');
      return;
    }

    setIsAdjusting(true);
    const promise = api.patch(`/transacoes/${transactionToAdjust.id}/adjust`, {
      newContaCorrenteId,
      newGoldAmount,
    });

    toast.promise(promise, {
      loading: 'Ajustando transação...',
      success: () => {
        setIsAdjusting(false);
        setTransactionToAdjust(null);
        setSale(null);
        setOrderNumber('');
        return 'Transação ajustada com sucesso!';
      },
      error: (err) => {
        setIsAdjusting(false);
        return err.response?.data?.message || 'Falha ao ajustar a transação.';
      },
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">Ajuste de Transação de Recebimento</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>1. Buscar Pedido</CardTitle>
          <CardDescription>Insira o número do pedido para ver as transações de recebimento associadas.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex-grow space-y-2">
            <Label htmlFor="orderNumber">Número do Pedido</Label>
            <Input 
              id="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Digite o número do pedido..."
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {sale && (
        <Card>
          <CardHeader>
            <CardTitle>2. Selecionar Transação</CardTitle>
            <CardDescription>Encontramos as seguintes transações para o pedido <strong>{sale.orderNumber}</strong>. Selecione uma para ajustar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Conta</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor (BRL)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor (Au)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sale.accountsRec?.flatMap(ar => ar.transacao ? [ar.transacao] : []).map(transacao => (
                    <tr key={transacao.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{transacao.descricao}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(transacao.dataHora)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{transacao.contaCorrente?.nome || 'N/A'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(transacao.valor)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{transacao.goldAmount ? `${Number(transacao.goldAmount).toFixed(4)}g` : '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Button variant="outline" size="sm" onClick={() => handleSelectTransaction(transacao)}>Ajustar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {transactionToAdjust && (
        <Card>
          <CardHeader>
            <CardTitle>3. Ajustar Transação</CardTitle>
            <CardDescription>Editando a transação: {transactionToAdjust.descricao}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Novos Dados</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nova Conta de Pagamento</Label>
                  <Combobox 
                    options={contas}
                    value={newContaCorrenteId}
                    onChange={setNewContaCorrenteId}
                    placeholder="Selecione a nova conta..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newGoldAmount">Novo Valor (Au)</Label>
                  <Input 
                    id="newGoldAmount"
                    type="number"
                    value={newGoldAmount}
                    onChange={(e) => setNewGoldAmount(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-primary/50 bg-primary/10 p-4">
                  <p className="text-sm font-semibold text-primary">Novo Valor Calculado (BRL):</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(newBRLAmount)}</p>
              </div>
            </div>

            <Button onClick={handleAdjust} disabled={isAdjusting} className="w-full">
              {isAdjusting ? 'Salvando Ajuste...' : 'Confirmar e Salvar Ajuste'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

