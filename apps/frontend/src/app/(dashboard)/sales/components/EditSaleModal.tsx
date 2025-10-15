'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

import Decimal from 'decimal.js';
import { useForm } from 'react-hook-form';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Sale } from '@/types/sale'; // Assuming a shared Sale type

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

interface EditSaleModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditSaleModal({ sale: initialSale, open, onOpenChange, onSave }: EditSaleModalProps) {
  const [sale, setSale] = useState<Sale | null>(initialSale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      updatedGoldPrice: 0,
      shippingCost: 0,
      paymentConditionId: '' as string | null,
    }
  });

  const { control, watch, reset } = form;
  
  const updatedGoldPrice = watch('updatedGoldPrice');
  const shippingCost = watch('shippingCost');
  const paymentConditionId = watch('paymentConditionId');

  const paymentOptions = useMemo(() => {
    const terms = paymentTerms.map(term => ({ value: term.id, label: term.name, isTerm: true }));
    return [
      ...terms, 
      { value: 'CREDIT_CARD', label: 'Cartão de Crédito', isTerm: false },
      { value: 'METAL', label: 'Metal', isTerm: false },
    ];
  }, [paymentTerms]);

  const selectedPaymentCondition = useMemo(() => {
    return paymentOptions.find(opt => opt.value === paymentConditionId);
  }, [paymentConditionId, paymentOptions]);

  useEffect(() => {
    if (initialSale) {
      setSale(initialSale);
      api.get('/payment-terms').then(res => {
        setPaymentTerms(res.data);
        reset({
          updatedGoldPrice: initialSale.goldPrice || 0,
          shippingCost: initialSale.shippingCost || 0,
          paymentConditionId: initialSale.paymentTermId || initialSale.paymentMethod || null,
        });
      });
    }
  }, [initialSale, reset]);

  // --- Calculation Logic for Real-time Summary ---
  const totalAmount = useMemo(() => {
    if (!sale?.saleItems || !updatedGoldPrice) return new Decimal(0);

    // Recalculate the total BRL amount of items based on the new quote
    return sale.saleItems.reduce((acc, item) => {
      const itemGoldValue = new Decimal(item.product?.goldValue || 0);
      const itemQuantity = new Decimal(item.quantity || 0);
      const quote = new Decimal(updatedGoldPrice);
      
      // For non-gold products, their price is fixed in BRL and doesn't change
      if (itemGoldValue.isZero()) {
        const fixedPrice = new Decimal(item.price || 0);
        return acc.plus(fixedPrice.times(itemQuantity));
      }

      const itemTotalBRL = itemQuantity.times(itemGoldValue).times(quote);
      return acc.plus(itemTotalBRL);
    }, new Decimal(0));

  }, [sale, updatedGoldPrice]);

  const netAmount = useMemo(() => {
    return totalAmount.plus(new Decimal(shippingCost || 0));
  }, [totalAmount, shippingCost]);

  const finalGoldValue = useMemo(() => {
    const price = new Decimal(updatedGoldPrice || 0);
    if (price.isZero()) return new Decimal(0);
    return netAmount.dividedBy(price);
  }, [netAmount, updatedGoldPrice]);


  const handleSaveChanges = async (formData: any) => {
    if (!sale) return;

    let paymentMethod = 'A_PRAZO';
    let paymentTermId = null;

    if (selectedPaymentCondition) {
      if (selectedPaymentCondition.value === 'CREDIT_CARD') {
        paymentMethod = 'CREDIT_CARD';
      } else if (selectedPaymentCondition.value === 'METAL') {
        paymentMethod = 'METAL';
      } else if (selectedPaymentCondition.isTerm) {
        paymentTermId = selectedPaymentCondition.value;
        // This logic can be improved, but it mirrors NewSaleForm
        if (selectedPaymentCondition.label.toLowerCase().includes('vista')) {
          paymentMethod = 'A_VISTA';
        } else {
          paymentMethod = 'A_PRAZO';
        }
      }
    }

    const payload = {
      updatedGoldPrice: formData.updatedGoldPrice,
      shippingCost: formData.shippingCost,
      paymentTermId: paymentTermId,
      paymentMethod: paymentMethod,
    };

    setIsSubmitting(true);
    try {
      await api.patch(`/sales/${sale.id}/edit`, payload);
      toast.success('Venda atualizada com sucesso!');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Falha ao atualizar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Venda #{sale?.orderNumber}</DialogTitle>
        </DialogHeader>
        {sale ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Editar Dados da Venda</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={control} name="updatedGoldPrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cotação do Ouro (R$)</FormLabel>
                        <FormControl><Input type="number" {...field} step="0.01" /></FormControl>
                      </FormItem>
                    )}/>
                    <FormField control={control} name="shippingCost" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo do Frete (R$)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )}/>
                    <FormField control={control} name="paymentConditionId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condição de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {paymentOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}/>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Resumo Financeiro (Recalculado)</CardTitle></CardHeader>
                  <CardContent className="space-y-3 pt-6">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Subtotal dos Itens</span>
                          <span className="font-mono">{formatCurrency(totalAmount.toNumber())}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Custo do Frete</span>
                          <span className="font-mono">{formatCurrency(Number(shippingCost))}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t mt-2">
                          <span className="text-muted-foreground text-lg">Total Final a Pagar (R$)</span>
                          <span className="font-bold text-xl text-green-600">{formatCurrency(netAmount.toNumber())}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2">
                          <span className="text-muted-foreground">Equivalente Total em Ouro</span>
                          <span className="font-mono">{finalGoldValue.toFixed(4)} g</span>
                      </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Itens da Venda</CardTitle></CardHeader>
                <CardContent>
                  <Table size="sm">
                    <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd.</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {sale.saleItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name || 'Item sem nome'}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : <p>Carregando dados da venda...</p>}
      </DialogContent>
    </Dialog>
  );
}
