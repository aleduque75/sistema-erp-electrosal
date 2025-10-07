'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

// This will be expanded with the full sale details later
interface SaleToAdjust {
  id: string;
  orderNumber: number;
  totalAmount: number;
  accountsRec: { amount: number }[];
  saleItems: { productName: string; quantity: number }[];
  // ... other fields will be added here
}

export default function SaleAdjustmentPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sale, setSale] = useState<SaleToAdjust | null>(null);

  // State for adjustable fields
  const [freightCost, setFreightCost] = useState(0);
  const [quotation, setQuotation] = useState(0);

  const handleSearch = async () => {
    if (!orderNumber) {
      toast.error('Por favor, insira um número de pedido.');
      return;
    }
    setIsLoading(true);
    setSale(null);
    try {
      // TODO: The backend needs an endpoint to find a sale by orderNumber
      // For now, let's assume we get it from the sales list endpoint
      const response = await api.get(`/sales?orderNumber=${orderNumber}`);
      if (response.data && response.data.length > 0) {
        setSale(response.data[0]);
        // TODO: Initialize freightCost and quotation from sale data if available
      } else {
        toast.error('Pedido não encontrado.');
      }
    } catch (error) {
      toast.error('Falha ao buscar o pedido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sale) return;

    const promise = api.post('/sale-adjustments', {
      saleId: sale.id,
      freightCost: freightCost,
      newQuotation: quotation,
    });

    toast.promise(promise, {
      loading: 'Salvando ajuste...',
      success: 'Ajuste salvo com sucesso!',
      error: 'Falha ao salvar o ajuste.',
    });
  };

  // TODO: Implement recalculation logic using useMemo
  const calculatedValues = {
    receivedGold: 0,
    profitGrams: 0,
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Ajuste de Vendas</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar Pedido</CardTitle>
          <CardDescription>Insira o número do pedido para carregar os detalhes e fazer ajustes.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Input
            placeholder="Número do Pedido"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {sale && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pedido #{sale.orderNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Original Sale Info (display-only) */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Valores Originais</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total da Venda (R$)</p>
                  <p className="font-mono">{sale.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Recebido (R$)</p>
                  <p className="font-mono">{sale.accountsRec.reduce((sum, ar) => sum + ar.amount, 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Adjustment Fields */}
            <div className="pt-6 border-t">
              <h3 className="font-semibold text-lg mb-4">Campos de Ajuste</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Cotação (R$/g)</label>
                  <Input type="number" value={quotation} onChange={e => setQuotation(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Custo do Frete (R$)</label>
                  <Input type="number" value={freightCost} onChange={e => setFreightCost(Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Calculated Results (display-only) */}
            <div className="pt-6 border-t">
              <h3 className="font-semibold text-lg mb-2">Resultados Calculados</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Valor Recebido (g)</p>
                  <p className="font-mono font-bold text-blue-500">{calculatedValues.receivedGold.toFixed(4)} g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lucro/Prejuízo (g)</p>
                  <p className="font-mono font-bold text-green-600">{calculatedValues.profitGrams.toFixed(4)} g</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <Button onClick={handleSave} size="lg">Salvar Ajuste</Button>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
