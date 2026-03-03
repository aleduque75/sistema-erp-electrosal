'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

import Decimal from 'decimal.js';
import { useForm } from 'react-hook-form';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  // State for editable item quantities: { [saleItemId]: quantity }
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const form = useForm({
    defaultValues: {
      updatedGoldPrice: 0,
      shippingCost: 0,
      paymentConditionId: '' as string | null,
      observation: '',
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
      { value: 'A_VISTA', label: 'À Vista', isTerm: false },
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
      // Initialize item quantities from the current sale items
      const initialQuantities: Record<string, number> = {};
      (initialSale.saleItems || []).forEach(item => {
        initialQuantities[item.id] = item.quantity;
      });
      setItemQuantities(initialQuantities);

      api.get('/payment-terms').then(res => {
        setPaymentTerms(res.data);
        reset({
          updatedGoldPrice: initialSale.goldPrice || 0,
          shippingCost: initialSale.shippingCost || 0,
          paymentConditionId: initialSale.paymentTermId || initialSale.paymentMethod || null,
          observation: initialSale.observation || '',
        });
      });
    }
  }, [initialSale, reset]);

  const handleQuantityChange = (itemId: string, value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      setItemQuantities(prev => ({ ...prev, [itemId]: parsed }));
    }
  };

  // --- Calculation Logic for Real-time Summary (uses itemQuantities state) ---
  const totalAmount = useMemo(() => {
    if (!sale?.saleItems || !updatedGoldPrice) return new Decimal(0);

    return sale.saleItems.reduce((acc, item) => {
      const currentQuantity = new Decimal(itemQuantities[item.id] ?? item.quantity ?? 0);
      const itemGoldValue = new Decimal(item.product?.goldValue || 0);
      const quote = new Decimal(updatedGoldPrice);

      // For non-gold products, their price is fixed in BRL and doesn't change
      if (itemGoldValue.isZero()) {
        const fixedPrice = new Decimal(item.price || 0);
        return acc.plus(fixedPrice.times(currentQuantity));
      }

      const itemTotalBRL = currentQuantity.times(itemGoldValue).times(quote);
      return acc.plus(itemTotalBRL);
    }, new Decimal(0));

  }, [sale, updatedGoldPrice, itemQuantities]);

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

    let paymentMethod = sale.paymentMethod || 'A_PRAZO';
    let paymentTermId = sale.paymentTermId || null;

    if (selectedPaymentCondition) {
      if (selectedPaymentCondition.value === 'CREDIT_CARD') {
        paymentMethod = 'CREDIT_CARD';
        paymentTermId = null;
      } else if (selectedPaymentCondition.value === 'METAL') {
        paymentMethod = 'METAL';
        paymentTermId = null;
      } else if (selectedPaymentCondition.value === 'A_VISTA') {
        paymentMethod = 'A_VISTA';
        paymentTermId = null;
      } else if (selectedPaymentCondition.isTerm) {
        paymentTermId = selectedPaymentCondition.value;
        if (selectedPaymentCondition.label.toLowerCase().includes('vista')) {
          paymentMethod = 'A_VISTA';
        } else {
          paymentMethod = 'A_PRAZO';
        }
      }
    }

    // Build item updates: only send items whose quantity changed
    const itemUpdates = (sale.saleItems || [])
      .filter(item => (itemQuantities[item.id] ?? item.quantity) !== item.quantity)
      .map(item => ({
        id: item.id,
        quantity: itemQuantities[item.id],
      }));

    const payload = {
      updatedGoldPrice: formData.updatedGoldPrice,
      shippingCost: formData.shippingCost,
      paymentTermId: paymentTermId,
      paymentMethod: paymentMethod,
      observation: formData.observation,
      items: itemUpdates.length > 0 ? itemUpdates : undefined,
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
                    )} />
                    <FormField control={control} name="shippingCost" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo do Frete (R$)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )} />
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
                    )} />
                    <FormField control={control} name="observation" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Observações adicionais..." className="resize-none h-24" />
                        </FormControl>
                      </FormItem>
                    )} />
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
                <CardHeader>
                  <CardTitle>Itens da Venda</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Edite as quantidades diretamente na tabela abaixo.
                  </p>
                </CardHeader>
                <CardContent>
                  <Table size="sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right w-32">Qtd. Original</TableHead>
                        <TableHead className="text-right w-36">Nova Qtd.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.saleItems.map((item) => {
                        const currentQty = itemQuantities[item.id] ?? item.quantity;
                        const hasChanged = currentQty !== item.quantity;
                        return (
                          <TableRow key={item.id} className={hasChanged ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                            <TableCell className="font-medium">{item.product?.name || 'Item sem nome'}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.001"
                                value={currentQty}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className={`w-28 ml-auto text-right ${hasChanged ? 'border-yellow-500 focus:border-yellow-500' : ''}`}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
