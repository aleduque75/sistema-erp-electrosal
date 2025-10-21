'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HistoricalAdjustmentPage() {
  const [startOrderNumber, setStartOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCorrectPayments = async () => {
    if (!startOrderNumber) {
      toast.error('Por favor, informe o número do pedido inicial.');
      return;
    }

    setIsLoading(true);
    const promise = api.post('/data-correction/correct-sales-payments', {
      startOrderNumber,
    });

    toast.promise(promise, {
      loading: 'Iniciando correção...',
      success: (res) => {
        setIsLoading(false);
        return res.data.message;
      },
      error: (err) => {
        setIsLoading(false);
        return err.response?.data?.message || 'Ocorreu um erro.';
      },
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ajuste Histórico de Dados</h1>

      <Card>
        <CardHeader>
          <CardTitle>1. Corrigir Recebimentos de Vendas de Sal</CardTitle>
          <CardDescription>
            Esta ferramenta irá estornar os recebimentos em R$ de vendas de "Sal 68%"
            e criar os pagamentos equivalentes em metal (g).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="startOrderNumber" className="block text-sm font-medium mb-1">
              Corrigir a partir do Pedido Nº:
            </label>
            <Input
              id="startOrderNumber"
              type="text"
              value={startOrderNumber}
              onChange={(e) => setStartOrderNumber(e.target.value)}
              placeholder="Ex: 31406"
              className="max-w-xs"
            />
          </div>
          <Button onClick={handleCorrectPayments} disabled={isLoading}>
            {isLoading ? 'Corrigindo...' : 'Corrigir Recebimentos'}
          </Button>
        </CardContent>
      </Card>

      {/* Seção 2 será adicionada aqui no futuro */}
    </div>
  );
}
