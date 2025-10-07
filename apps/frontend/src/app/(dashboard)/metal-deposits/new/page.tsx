'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';

// Interfaces
interface Pessoa {
  id: string;
  name: string;
}

const metalTypes = ['AU', 'AG', 'RH']; // Assuming these are the metal types

export default function NewMetalDepositPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [pessoaId, setPessoaId] = useState<string>('');
  const [paidAmountBRL, setPaidAmountBRL] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [metalType, setMetalType] = useState<string>('AU');

  useEffect(() => {
    // Fetch all clients/pessoas to populate the selector
    api.get('/pessoas').then(res => setPessoas(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pessoaId || !paidAmountBRL || !paymentDate || !metalType) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    const promise = api.post('/metal-deposits', {
      pessoaId,
      paidAmountBRL: Number(paidAmountBRL),
      paymentDate: paymentDate.toISOString(),
      metalType,
    });

    toast.promise(promise, {
      loading: 'Registrando depósito de metal...',
      success: (res) => {
        // Reset form
        setPessoaId('');
        setPaidAmountBRL('');
        setPaymentDate(new Date());
        return 'Depósito de metal registrado com sucesso!';
      },
      error: (err) => err.response?.data?.message || 'Falha ao registrar o depósito.',
      finally: () => setIsLoading(false),
    });
  };

  return (
    <div className="p-4 md:p-8 flex justify-center items-start">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Registrar Depósito em Metal</CardTitle>
          <CardDescription>
            Use este formulário para converter um pagamento em Reais (R$) em um crédito de metal na conta do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={pessoaId} onValueChange={setPessoaId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor Pago (R$)</Label>
                <Input 
                  id="amount"
                  type="number"
                  value={paidAmountBRL}
                  onChange={e => setPaidAmountBRL(e.target.value)}
                  placeholder="Ex: 1000.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Metal</Label>
                <Select value={metalType} onValueChange={setMetalType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o metal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {metalTypes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <DatePicker date={paymentDate} onDateChange={setPaymentDate} />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full !mt-8" size="lg">
              {isLoading ? 'Registrando...' : 'Registrar Depósito'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
