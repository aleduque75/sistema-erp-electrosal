'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import Decimal from 'decimal.js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sale } from '../page'; // This type might need to be enhanced

interface ConfirmSaleModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  paymentMethod: z.string().min(1, 'Método de pagamento é obrigatório.'),
  numberOfInstallments: z.coerce.number().int().min(1).optional(),
  contaCorrenteId: z.string().uuid().optional().nullable(),
});

type ConfirmSaleFormValues = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export function ConfirmSaleModal({
  sale: initialSale,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmSaleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contasCorrentes, setContasCorrentes] = useState<{ id: string; nome: string }[]>([]);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [laborCostTable, setLaborCostTable] = useState<any[]>([]);
  const [detailedSale, setDetailedSale] = useState<any | null>(null);

  const { control, handleSubmit, watch, reset } = useForm<ConfirmSaleFormValues>({
    resolver: zodResolver(formSchema),
  });

  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (open && initialSale) {
      setIsSubmitting(false);
      // Fetch all necessary data in parallel
      Promise.all([
        api.get(`/sales/${initialSale.id}`),
        api.get('/quotations/latest?metal=AU'),
        api.get('/labor-cost-table-entries'),
        api.get('/contas-correntes'),
      ]).then(([saleRes, quoteRes, laborRes, contasRes]) => {
        setDetailedSale(saleRes.data);
        const latestQuote = quoteRes.data?.sellPrice || saleRes.data.goldPrice || 0;
        setCurrentQuote(latestQuote);
        setLaborCostTable(laborRes.data);
        setContasCorrentes(contasRes.data);
        reset({ paymentMethod: saleRes.data.paymentMethod || 'A_PRAZO', numberOfInstallments: 1, contaCorrenteId: null });
      }).catch(() => toast.error("Falha ao carregar dados para confirmação."));
    }
  }, [open, initialSale, reset]);

  const recalculatedNetAmount = useMemo(() => {
    if (!detailedSale || !currentQuote || !laborCostTable.length) {
      return Number(detailedSale?.netAmount || 0);
    }

    let newTotalAmount = new Decimal(0);
    for (const item of detailedSale.saleItems) {
      if (item.product.productGroup?.isReactionProductGroup) {
        const itemQuantity = new Decimal(item.quantity);
        const goldGramsSold = itemQuantity.times(item.product.goldValue || 0);
        const laborEntry = laborCostTable.find(e => 
          goldGramsSold.gte(e.minGrams) && (e.maxGrams === null || goldGramsSold.lte(e.maxGrams))
        );
        const laborGrams = laborEntry ? new Decimal(laborEntry.goldGramsCharged) : new Decimal(0);
        const totalGoldForPrice = goldGramsSold.plus(laborGrams);
        const newItemTotal = totalGoldForPrice.times(currentQuote);
        newTotalAmount = newTotalAmount.plus(newItemTotal);
      } else {
        newTotalAmount = newTotalAmount.plus(new Decimal(item.price).times(item.quantity));
      }
    }
    return newTotalAmount.plus(detailedSale.feeAmount || 0).toNumber();
  }, [detailedSale, currentQuote, laborCostTable]);

  const onSubmit = async (data: ConfirmSaleFormValues) => {
    if (!detailedSale) return;

    const payload = {
      ...data,
      updatedGoldPrice: currentQuote,
      updatedNetAmount: recalculatedNetAmount,
    };

    setIsSubmitting(true);
    try {
      await api.post(`/sales/${detailedSale.id}/confirm`, payload);
      toast.success('Venda confirmada com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Falha ao confirmar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!detailedSale) return null; // Render nothing until detailed sale is loaded

  const hasPriceChanged = Number(detailedSale.netAmount).toFixed(2) !== recalculatedNetAmount.toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Venda #{detailedSale.orderNumber}</DialogTitle>
          <DialogDescription>Confirme os detalhes de pagamento. A cotação do ouro foi atualizada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 rounded-lg border p-4">
            <p><span className="font-semibold">Cliente:</span> {detailedSale.pessoa.name}</p>
            <p><span className="font-semibold">Valor Original:</span> {formatCurrency(Number(detailedSale.netAmount))}</p>
            {hasPriceChanged && (
              <Alert variant="warning">
                <AlertTitle>Atenção: O Preço Mudou!</AlertTitle>
                <AlertDescription>
                  O valor foi recalculado para <span className="font-bold">{formatCurrency(recalculatedNetAmount)}</span> com base na cotação atual do ouro.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-1">
            <Label>Cotação do Ouro (R$)</Label>
            <Input type="number" value={currentQuote} onChange={e => setCurrentQuote(Number(e.target.value))} step="0.01" />
          </div>
          
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Label>Método de Pagamento</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A_VISTA">À Vista</SelectItem>
                    <SelectItem value="A_PRAZO">A Prazo</SelectItem>
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                    <SelectItem value="METAL">Metal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          {paymentMethod === 'A_VISTA' && (
            <Controller
              name="contaCorrenteId"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <Label>Receber em</Label>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger><SelectValue placeholder="Selecione a conta..." /></SelectTrigger>
                    <SelectContent>
                      {contasCorrentes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          )}

          {paymentMethod === 'A_PRAZO' && (
             <Controller
                name="numberOfInstallments"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Nº de Parcelas</Label>
                    <Input {...field} type="number" min={1} />
                  </div>
                )}
              />
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Confirmando...' : 'Confirmar Venda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
