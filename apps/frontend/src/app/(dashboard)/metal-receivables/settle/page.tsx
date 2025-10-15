'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker'; // Assuming this component exists

// Interfaces
interface Pessoa {
  id: string;
  name: string;
}

interface MetalReceivable {
  id: string;
  saleId: string;
  metalType: string;
  grams: number;
  remainingGrams: number;
  status: string;
  dueDate: string;
  sale: { orderNumber: number };
}

export default function SettleMetalReceivablesPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [selectedPessoaId, setSelectedPessoaId] = useState<string | null>(null);
  const [receivables, setReceivables] = useState<MetalReceivable[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for the payment form
  const [paymentAmountBRL, setPaymentAmountBRL] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [activeReceivable, setActiveReceivable] = useState<MetalReceivable | null>(null);

  useEffect(() => {
    // Fetch all clients/pessoas to populate the selector
          api.get('/pessoas?role=CLIENT').then(res => setPessoas(res.data));  }, []);

  useEffect(() => {
    if (selectedPessoaId) {
      setIsLoading(true);
      api.get(`/metal-receivables?pessoaId=${selectedPessoaId}&status=PENDENTE,PAGO_PARCIALMENTE`)
        .then(res => setReceivables(res.data))
        .catch(() => toast.error('Falha ao buscar recebíveis de metal.'))
        .finally(() => setIsLoading(false));
    }
  }, [selectedPessoaId]);

  const handleSettlePayment = async () => {
    if (!activeReceivable || !paymentAmountBRL || !paymentDate) {
      toast.error('Por favor, preencha todos os campos do pagamento.');
      return;
    }

    const promise = api.post('/metal-receivable-payments', {
      metalReceivableId: activeReceivable.id,
      paidAmountBRL: paymentAmountBRL,
      paymentDate: paymentDate.toISOString(),
    });

    toast.promise(promise, {
      loading: 'Registrando pagamento...',
      success: (res) => {
        // Refresh the list of receivables
        if (selectedPessoaId) {
          api.get(`/metal-receivables?pessoaId=${selectedPessoaId}&status=PENDENTE,PAGO_PARCIALMENTE`).then(res => setReceivables(res.data));
        }
        setActiveReceivable(null); // Close dialog
        return 'Pagamento registrado com sucesso!';
      },
      error: (err) => err.response?.data?.message || 'Falha ao registrar pagamento.',
    });
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Baixa de Recebíveis de Metal</h1>
      
      <Card className="mb-6 max-w-md">
        <CardHeader>
          <CardTitle>Selecione um Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedPessoaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPessoaId && isLoading && <p>Carregando...</p>}

      {selectedPessoaId && !isLoading && (
        <div className="space-y-4">
          {receivables.length === 0 ? (
            <p>Nenhum recebível de metal pendente para este cliente.</p>
          ) : (
            receivables.map(rec => (
              <Card key={rec.id}>
                <CardHeader>
                  <CardTitle>Pedido #{rec.sale.orderNumber}</CardTitle>
                  <CardDescription>Vencimento: {new Date(rec.dueDate).toLocaleDateString('pt-BR')}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Dívida Total</p>
                    <p className="text-lg font-bold">{Number(rec.grams).toFixed(4)} g de {rec.metalType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Devedor</p>
                    <p className="text-lg font-bold text-red-600">{Number(rec.remainingGrams).toFixed(4)} g</p>
                  </div>
                  <Dialog onOpenChange={(open) => !open && setActiveReceivable(null)}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setActiveReceivable(rec)}>Registrar Pagamento</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registrar Pagamento para Pedido #{rec.sale.orderNumber}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label>Valor Pago (R$)</label>
                          <Input type="number" onChange={e => setPaymentAmountBRL(Number(e.target.value))} />
                        </div>
                        <div>
                          <label>Data do Pagamento</label>
                          <DatePicker date={paymentDate} onDateChange={setPaymentDate} />
                        </div>
                        <Button onClick={handleSettlePayment} className="w-full">Salvar Pagamento</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
