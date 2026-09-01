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
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { PlusCircle, Trash2 } from 'lucide-react';
import { Sale, Product } from '@/types/sale';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

interface EditSaleModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface EditableItem {
  id?: string;
  productId: string;
  productName: string;
  goldValue: number;
  quantity: number;
  originalQuantity: number;
  price: number;
  isNew?: boolean;
}

export function EditSaleModal({ sale: initialSale, open, onOpenChange, onSave }: EditSaleModalProps) {
  const [sale, setSale] = useState<Sale | null>(initialSale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);

  // State for new product addition
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProductQty, setNewProductQty] = useState<number>(1);

  const form = useForm({
    defaultValues: {
      updatedGoldPrice: 0,
      shippingCost: 0,
      paymentConditionId: '' as string | null,
      contaCorrenteId: '' as string | null,
      observation: '',
    }
  });

  const { control, watch, reset, setValue } = form;

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

  const isAVista = useMemo(() => {
    if (!selectedPaymentCondition) return false;
    if (selectedPaymentCondition.value === 'A_VISTA') return true;
    return selectedPaymentCondition.label.toLowerCase().includes('vista');
  }, [selectedPaymentCondition]);

  useEffect(() => {
    if (initialSale) {
      setSale(initialSale);

      const itemsList: EditableItem[] = (initialSale.saleItems || []).map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Item sem nome',
        goldValue: Number(item.product?.goldValue || 0),
        quantity: Number(item.quantity || 0),
        originalQuantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        isNew: false,
      }));
      setEditableItems(itemsList);

      Promise.all([
        api.get('/payment-terms'),
        api.get('/contas-correntes', { params: { types: ['BANCO', 'FORNECEDOR_METAL'] } }),
        api.get('/products'),
      ]).then(([termsRes, contasRes, productsRes]) => {
        setPaymentTerms(termsRes.data || []);
        setContasCorrentes(contasRes.data || []);
        setProducts(productsRes.data || []);

        reset({
          updatedGoldPrice: initialSale.goldPrice || 0,
          shippingCost: initialSale.shippingCost || 0,
          paymentConditionId: initialSale.paymentTermId || initialSale.paymentMethod || null,
          contaCorrenteId: initialSale.paymentAccountName
            ? contasRes.data.find((c: any) => c.nome === initialSale.paymentAccountName)?.id || null
            : null,
          observation: initialSale.observation || '',
        });
      }).catch(err => {
        console.error('Falha ao carregar dados auxiliares do pedido:', err);
      });
    }
  }, [initialSale, reset]);

  const handleQuantityChange = (index: number, value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      setEditableItems(prev => {
        const next = [...prev];
        next[index] = { ...next[index], quantity: parsed };
        return next;
      });
    }
  };

  const handlePriceChange = (index: number, value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      setEditableItems(prev => {
        const next = [...prev];
        next[index] = { ...next[index], price: parsed };
        return next;
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setEditableItems(prev => {
      const next = [...prev];
      if (next[index].isNew) {
        // Remove completely if new
        return next.filter((_, i) => i !== index);
      }
      // If existing, set quantity to 0 so backend deletes it
      next[index] = { ...next[index], quantity: 0 };
      return next;
    });
  };

  const handleAddNewProduct = () => {
    if (!selectedProductId) {
      toast.warning('Selecione um produto para adicionar.');
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    setEditableItems(prev => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        goldValue: Number(product.goldValue || 0),
        quantity: newProductQty > 0 ? newProductQty : 1,
        originalQuantity: 0,
        price: Number(product.price || 0),
        isNew: true,
      }
    ]);

    setSelectedProductId('');
    setNewProductQty(1);
    toast.success(`Produto "${product.name}" adicionado.`);
  };

  // --- Calculation Logic for Real-time Summary ---
  const totalAmount = useMemo(() => {
    if (!updatedGoldPrice) return new Decimal(0);

    return editableItems.reduce((acc, item) => {
      if (item.quantity <= 0) return acc;
      const currentQuantity = new Decimal(item.quantity);
      const itemGoldValue = new Decimal(item.goldValue || 0);
      const quote = new Decimal(updatedGoldPrice);

      // For non-gold products, price is fixed in BRL
      if (itemGoldValue.isZero()) {
        const fixedPrice = new Decimal(item.price || 0);
        return acc.plus(fixedPrice.times(currentQuantity));
      }

      const itemTotalBRL = currentQuantity.times(itemGoldValue).times(quote);
      return acc.plus(itemTotalBRL);
    }, new Decimal(0));
  }, [updatedGoldPrice, editableItems]);

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
        paymentMethod = selectedPaymentCondition.label.toLowerCase().includes('vista') ? 'A_VISTA' : 'A_PRAZO';
      }
    }

    if (paymentMethod === 'A_VISTA' && !formData.contaCorrenteId) {
      toast.error('Para pagamento À Vista, por favor selecione a Conta Corrente de destino.');
      return;
    }

    // Build item payload: modified existing items or new items
    const itemUpdates = editableItems.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const payload = {
      updatedGoldPrice: formData.updatedGoldPrice,
      shippingCost: formData.shippingCost,
      paymentTermId: paymentTermId,
      paymentMethod: paymentMethod,
      contaCorrenteId: formData.contaCorrenteId || undefined,
      observation: formData.observation,
      items: itemUpdates,
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
      <DialogContent className="w-[96vw] max-w-5xl max-h-[94vh] flex flex-col p-3 md:p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar Venda #{sale?.orderNumber}</DialogTitle>
        </DialogHeader>
        {sale ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-4 flex-1 overflow-y-auto p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="p-3 md:p-4">
                    <CardTitle className="text-base">Editar Dados da Venda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3 md:p-4 pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField control={control} name="updatedGoldPrice" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Cotação Ouro (R$)</FormLabel>
                          <FormControl><Input type="number" className="h-9 text-xs" {...field} step="0.01" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={control} name="shippingCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Frete (R$)</FormLabel>
                          <FormControl><Input type="number" className="h-9 text-xs" {...field} step="0.01" /></FormControl>
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={control} name="paymentConditionId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Condição de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {paymentOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    {isAVista && (
                      <FormField control={control} name="contaCorrenteId" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Receber em (Conta Corrente)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione a conta..." /></SelectTrigger></FormControl>
                            <SelectContent>
                              {contasCorrentes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    )}

                    <FormField control={control} name="observation" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Observações adicionais..." className="resize-none h-16 text-xs" />
                        </FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 md:p-4">
                    <CardTitle className="text-base">Resumo Financeiro (Recalculado)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 p-3 md:p-4 pt-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Subtotal dos Itens</span>
                      <span className="font-mono font-medium">{formatCurrency(totalAmount.toNumber())}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Custo do Frete</span>
                      <span className="font-mono font-medium">{formatCurrency(Number(shippingCost))}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                      <span className="text-muted-foreground text-sm font-semibold">Total Final a Pagar (R$)</span>
                      <span className="font-black text-lg text-emerald-500">{formatCurrency(netAmount.toNumber())}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2">
                      <span className="text-muted-foreground">Equivalente Total em Ouro</span>
                      <span className="font-mono font-bold">{finalGoldValue.toFixed(4)} g</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Itens da Venda */}
              <Card>
                <CardHeader className="p-3 md:p-4 flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Itens da Venda</CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Edite as quantidades ou adicione novos produtos ao pedido.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0 space-y-3">
                  {/* Incluir Novo Produto */}
                  <div className="flex flex-wrap items-end gap-2 bg-muted/40 p-2.5 rounded-lg border">
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <FormLabel className="text-xs font-semibold">Adicionar Novo Produto</FormLabel>
                      <Combobox
                        options={products.map(p => ({ value: p.id, label: p.name }))}
                        value={selectedProductId}
                        onChange={setSelectedProductId}
                        placeholder="Selecione um produto..."
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <FormLabel className="text-xs font-semibold">Qtd</FormLabel>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="h-9 text-xs"
                        value={newProductQty}
                        onChange={e => setNewProductQty(parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <Button type="button" size="sm" className="h-9 px-3 gap-1" onClick={handleAddNewProduct}>
                      <PlusCircle className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-right w-24 text-xs">Qtd</TableHead>
                        <TableHead className="text-right w-28 text-xs">Preço Unit.</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editableItems.length > 0 ? (
                        editableItems.map((item, idx) => {
                          const isRemoved = item.quantity <= 0;
                          return (
                            <TableRow key={item.id || idx} className={isRemoved ? 'opacity-40 bg-red-500/10' : item.isNew ? 'bg-emerald-500/10' : ''}>
                              <TableCell className="font-semibold text-xs">
                                {item.productName}
                                {item.isNew && <span className="ml-1 text-[10px] text-emerald-500 font-bold">(Novo)</span>}
                                {isRemoved && <span className="ml-1 text-[10px] text-red-500 font-bold">(Removido)</span>}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  disabled={isRemoved}
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                  className="w-20 ml-auto text-right h-8 text-xs font-bold"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  disabled={isRemoved}
                                  value={item.price}
                                  onChange={(e) => handlePriceChange(idx, e.target.value)}
                                  className="w-24 ml-auto text-right h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                  onClick={() => handleRemoveItem(idx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground text-xs py-4">
                            Nenhum item no pedido.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <DialogFooter className="pt-2">
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
