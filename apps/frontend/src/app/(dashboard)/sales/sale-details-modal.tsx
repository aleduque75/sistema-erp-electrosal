'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Decimal from 'decimal.js';
import { useForm, Controller } from 'react-hook-form';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Sale } from '@/types/sale';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

interface SaleDetailsModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function SaleDetailsModal({ sale: initialSale, open, onOpenChange, onSave }: SaleDetailsModalProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data for selects
  const [contasCorrentes, setContasCorrentes] = useState<{ id: string; nome: string }[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      quotation: 0,
      shippingCost: 0,
      paymentConditionId: '' as string | null,
      contaCorrenteId: '' as string | null,
      numberOfInstallments: 1,
    }
  });

  const { control, watch, reset } = form;
  
  // Leitura direta dos valores do formulário
  const rawQuote = watch('quotation');
  const rawShippingCost = watch('shippingCost');

  // Conversão segura para number: garante que é um número, mesmo se o input estiver vazio
  const editableQuote = useMemo(() => new Decimal(rawQuote || 0).toNumber(), [rawQuote]);
  const editableShippingCost = useMemo(() => new Decimal(rawShippingCost || 0).toNumber(), [rawShippingCost]);
  
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
    if (open && initialSale) {
      setIsLoading(true);
      api.get(`/sales/${initialSale.id}`)
        .then(res => {
          const saleData = res.data;
          setSale(saleData);
          
          reset({
            quotation: saleData.goldPrice || 0,
            shippingCost: saleData.shippingCost || 0,
            paymentConditionId: saleData.paymentTermId || saleData.paymentMethod || 'A_PRAZO',
            contaCorrenteId: saleData.contaCorrenteId || null, 
            numberOfInstallments: saleData.numberOfInstallments || 1,
          });
          
          Promise.all([
            api.get('/contas-correntes'),
            api.get('/payment-terms'),
          ]).then(([contasRes, termsRes]) => {
            setContasCorrentes(contasRes.data);
            setPaymentTerms(termsRes.data);
          });
        })
        .catch(() => toast.error("Falha ao carregar dados da venda."))
        .finally(() => setIsLoading(false));
    }
  }, [open, initialSale, reset]);

  // --- Calculation Logic ---

  // 1. Valor do Ouro (em BRL) - Peso Base * Cotação Editável
  const goldValueInBRL = useMemo(() => {
    const quote = new Decimal(editableQuote);
    const goldValueFromSale = new Decimal(sale?.goldValue || 0);
    return goldValueFromSale.times(quote).toNumber();
  }, [sale, editableQuote]);

  // 2. Valor Final em BRL = Valor do Ouro em BRL + Frete
  const finalBRLValue = useMemo(() => {
    const quote = new Decimal(editableQuote);
    
    if (quote.lte(0)) return new Decimal(sale?.netAmount || 0).toNumber();

    return new Decimal(goldValueInBRL).plus(editableShippingCost).toNumber();
  }, [sale, goldValueInBRL, editableShippingCost, editableQuote]);

  // 3. Valor Equivalente Total em Ouro = Total BRL / Cotação Editável
  const finalGoldValue = useMemo(() => {
    const quote = new Decimal(editableQuote);
    if (quote.lte(0)) return new Decimal(sale?.goldValue || 0).toNumber();
    
    return new Decimal(finalBRLValue).dividedBy(quote).toNumber();
  }, [finalBRLValue, editableQuote, sale]);


  const handleConfirmPayment = async (formData: any) => {
    if (!sale) return;

    let paymentMethodToSend = 'A_PRAZO';
    let paymentTermIdToSend = null;

    if (selectedPaymentCondition) {
      if (selectedPaymentCondition.value === 'CREDIT_CARD') {
        paymentMethodToSend = 'CREDIT_CARD';
      } else if (selectedPaymentCondition.value === 'METAL') {
        paymentMethodToSend = 'METAL';
      } else if (selectedPaymentCondition.isTerm) {
        paymentTermIdToSend = selectedPaymentCondition.value;
        if (selectedPaymentCondition.label.toLowerCase().includes('vista')) {
          paymentMethodToSend = 'A_VISTA';
        } else {
          paymentMethodToSend = 'A_PRAZO';
        }
      }
    }

    const payload: any = {
      paymentMethod: paymentMethodToSend,
      numberOfInstallments: formData.numberOfInstallments,
      contaCorrenteId: formData.contaCorrenteId || null,
      updatedGoldPrice: formData.quotation,
      updatedNetAmount: finalBRLValue,
    };

    if (paymentTermIdToSend) {
      payload.paymentTermId = paymentTermIdToSend;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/sales/${sale.id}/confirm`, payload);
      toast.success('Venda confirmada com sucesso!');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Falha ao confirmar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes e Confirmação da Venda #{sale?.orderNumber}</DialogTitle>
        </DialogHeader>
        {isLoading ? <p>Carregando...</p> : sale ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleConfirmPayment)} className="space-y-6 p-4">
              <Card>
                <CardHeader><CardTitle>Ajustes e Pagamento</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={control} name="quotation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cotação do Ouro (R$)</FormLabel>
                      <FormControl><Input type="number" {...field} step="0.01" disabled={sale.status !== 'PENDENTE'} /></FormControl>
                    </FormItem>
                  )}/>
                  <FormField control={control} name="shippingCost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo do Frete (R$)</FormLabel>
                      <FormControl><Input type="number" {...field} step="0.01" disabled={sale.status !== 'PENDENTE'} /></FormControl>
                    </FormItem>
                  )}/>
                  <FormField control={control} name="paymentConditionId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={sale.status !== 'PENDENTE'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {paymentOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}/>
                  
                  {/* Campo de Número de Parcelas (visível se for a prazo) */}
                  {selectedPaymentCondition?.isTerm && selectedPaymentCondition.label.toLowerCase().includes('prazo') && (
                    <FormField control={control} name="numberOfInstallments" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Nº de Parcelas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              // Garante que o valor é tratado como um número inteiro para o estado do formulário
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              min={1} 
                              disabled={sale.status !== 'PENDENTE'} 
                            />
                          </FormControl>
                      </FormItem>
                    )}/>
                  )}

                  {/* Campo de Conta Corrente (visível se for à vista ou por cartão/metal) */}
{selectedPaymentCondition?.label.toLowerCase().includes('vista') && selectedPaymentCondition?.value !== 'METAL' && (
                    <FormField control={control} name="contaCorrenteId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receber em</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={sale.status !== 'PENDENTE'}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione a conta..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {contasCorrentes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}/>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Resumo Financeiro</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Peso Total do Ouro (Itens)</span>
                        <span className="font-bold">{new Decimal(sale?.goldValue || 0).toFixed(4)} g</span>
                    </div>
                    
                    {/* LINHA CORRIGIDA: Usa Number(editableQuote) para garantir o tipo number antes de toFixed() */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Valor do Ouro (R$ {Number(editableQuote).toFixed(2)}/g)</span>
                        <span className="font-mono">{formatCurrency(goldValueInBRL)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Custo do Frete</span>
                        <span className="font-mono">{formatCurrency(editableShippingCost)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                        <span className="text-muted-foreground text-lg">Total Final a Pagar (R$)</span>
                        <span className="font-bold text-xl text-green-600">{formatCurrency(finalBRLValue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2">
                        <span className="text-muted-foreground">Equivalente Total em Ouro</span>
                        <span className="font-mono">{finalGoldValue.toFixed(4)} g</span>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Itens da Venda</CardTitle></CardHeader>
                <CardContent>
                  <Table size="sm">
                    <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd.</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {sale.saleItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
              {sale?.status === 'PENDENTE' && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Confirmando...' : 'Confirmar Pagamento'}
                </Button>
              )}
            </DialogFooter>
            </form>
          </Form>
        ) : <p>Não foi possível carregar os detalhes.</p>}
      </DialogContent>
    </Dialog>
  );
}