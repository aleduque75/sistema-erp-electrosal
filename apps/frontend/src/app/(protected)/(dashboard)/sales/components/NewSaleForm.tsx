import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  PlusCircle,
  Trash2,
  PackageSearch,
  FileText,
  ShoppingBag,
  CreditCard,
  Building2,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Decimal from "decimal.js";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { LotSelectionModal } from "@/components/sales/LotSelectionModal";
import { AddItemModal } from "./AddItemModal";
import { Product, SaleItem, SaleItemLot, InventoryLot } from "@/types/sale";

// --- Interfaces ---
interface Client { id: string; name: string; }
interface ContaCorrente { id: string; nome: string; }
interface Fee { id: string; installments: number; feePercentage: number; }
interface PaymentTerm { id: string; name: string; installmentsDays: number[]; interestRate?: number; }

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const formSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  paymentConditionId: z.string().min(1, "Selecione a condição de pagamento."),
  numberOfInstallments: z.coerce.number().int().min(1).optional(),
  contaCorrenteId: z.string().nullable().optional(),
  orderNumber: z.coerce.number().int().positive().optional(),
  observation: z.string().optional(),
});

export function NewSaleForm({ onSave }: any) {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feePercentage, setFeePercentage] = useState(0);
  const [absorbCreditCardFee, setAbsorbCreditCardFee] = useState(false);
  const [saleGoldQuote, setSaleGoldQuote] = useState(0);
  const [saleSilverQuote, setSaleSilverQuote] = useState(0);
  const [laborCostTable, setLaborCostTable] = useState([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [itemToSelectLots, setItemToSelectLots] = useState<{ product: any, itemIndex: number } | null>(null);
  const [freightAmount, setFreightAmount] = useState(0);
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
  } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: { clientId: "", paymentConditionId: "", numberOfInstallments: 1, contaCorrenteId: null, observation: "" },
  });
  const paymentConditionId = watch("paymentConditionId");
  const numberOfInstallments = watch("numberOfInstallments");

  const paymentOptions = useMemo(() => {
    const terms = paymentTerms.map(term => ({ value: term.id, label: term.name, isTerm: true }));
    return [
      ...terms,
      { value: 'CREDIT_CARD', label: 'Cartão de Crédito', isTerm: false },
      { value: 'METAL', label: 'Metal', isTerm: false },
      { value: 'A_COMBINAR', label: 'A Combinar (Gerar Recebível)', isTerm: false },
    ];
  }, [paymentTerms]);

  const selectedPaymentCondition = useMemo(() => {
    return paymentOptions.find(opt => opt.value === paymentConditionId);
  }, [paymentConditionId, paymentOptions]);

  const currentPaymentMethod = useMemo(() => {
    if (!selectedPaymentCondition) return null;
    if (selectedPaymentCondition.value === 'CREDIT_CARD') return 'CREDIT_CARD';
    if (selectedPaymentCondition.value === 'METAL') return 'METAL';
    if (selectedPaymentCondition.value === 'A_COMBINAR') return 'A_COMBINAR';
    if (selectedPaymentCondition.isTerm) {
      const term = paymentTerms.find(t => t.id === selectedPaymentCondition.value);
      if (term && term.installmentsDays.length === 1 && selectedPaymentCondition.label.toLowerCase().includes('vista')) {
        return 'A_VISTA';
      }
      return 'A_PRAZO';
    }
    return null;
  }, [selectedPaymentCondition]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Fetch next order number
        const nextOrderNumberRes = await api.get('/sales/next-order-number');
        if (nextOrderNumberRes.data.nextOrderNumber) {
          setValue('orderNumber', nextOrderNumberRes.data.nextOrderNumber);
        }

        const [clientsRes, productsRes, contasRes, feesRes, orgSettingsRes, paymentTermsRes, goldQuoteRes, silverQuoteRes, laborTableRes] = await Promise.all([
          api.get("/pessoas?role=CLIENT"),
          api.get("/products"),
          api.get("/contas-correntes", { params: { types: ['BANCO', 'FORNECEDOR_METAL'] } }),
          api.get("/credit-card-fees"),
          api.get("/settings/organization"),
          api.get("/payment-terms"),
          api.get(`/quotations/latest?metal=AU&date=${saleDate?.toISOString()}`),
          api.get(`/quotations/latest?metal=AG&date=${saleDate?.toISOString()}`),
          api.get("/labor-cost-table-entries"),
        ]);
        setClients(clientsRes.data.map((c: any) => ({ id: c.id, name: c.name })));
        setProducts(productsRes.data);
        setContasCorrentes(contasRes.data);
        setFees(feesRes.data);
        setAbsorbCreditCardFee(orgSettingsRes.data.absorbCreditCardFee);
        setPaymentTerms(paymentTermsRes.data);
        setLaborCostTable(laborTableRes.data);

        if (goldQuoteRes.data?.sellPrice) {
          setSaleGoldQuote(goldQuoteRes.data.sellPrice);
        } else {
          setSaleGoldQuote(0);
        }

        if (silverQuoteRes.data?.sellPrice) {
          setSaleSilverQuote(silverQuoteRes.data.sellPrice);
        } else {
          setSaleSilverQuote(0);
        }

        if (goldQuoteRes.data?.sellPrice || silverQuoteRes.data?.sellPrice) {
          toast.info(`Cotações para ${saleDate?.toLocaleDateString()} carregadas.`);
        } else {
          toast.warning(`Não foram encontradas cotações para a data ${saleDate?.toLocaleDateString()}.`);
        }
      } catch (error) {
        toast.error("Falha ao carregar dados para a venda.");
      }
    }
    fetchInitialData();
  }, [saleDate, setValue]);

  useEffect(() => {
    if (paymentConditionId === "CREDIT_CARD" && numberOfInstallments) {
      const selectedFee = fees.find(
        (f) => f.installments === numberOfInstallments
      );
      setFeePercentage(selectedFee ? Number(selectedFee.feePercentage) : 0);
    } else {
      setFeePercentage(0);
    }
  }, [paymentConditionId, numberOfInstallments, fees]);

  const handleAddNewItem = () => {
    setIsAddItemModalOpen(true);
  };

  const handleAddItem = (newItemData: any) => {
    const product = products.find(p => p.id === newItemData.productId);
    let assignedLots: SaleItemLot[] = [];

    if (newItemData.inventoryLotId) {
      // User manually selected a lot in the AddItemModal
      assignedLots = [{
        inventoryLotId: newItemData.inventoryLotId,
        quantity: newItemData.quantity
      } as any];
    } else if (product && product.inventoryLots && product.inventoryLots.length > 0) {
      // Automatic FIFO allocation
      let remainingToAssign = new Decimal(newItemData.quantity);

      // Sort lots by date (oldest first)
      const sortedLots = [...product.inventoryLots].sort(
        (a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime()
      );

      for (const lot of sortedLots) {
        if (remainingToAssign.lte(0)) break;

        // Calculate available in this lot (subtracting what's already in other items of this sale)
        const alreadyUsedInSale = items
          .filter(item => item.productId === product.id)
          .flatMap(item => item.lots || [])
          .filter(l => l.inventoryLotId === lot.id)
          .reduce((sum, l) => sum.plus(l.quantity), new Decimal(0));

        const availableInLot = new Decimal(lot.remainingQuantity).minus(alreadyUsedInSale);

        if (availableInLot.gt(0)) {
          const amountFromThisLot = Decimal.min(remainingToAssign, availableInLot);
          assignedLots.push({
            inventoryLotId: lot.id,
            quantity: amountFromThisLot.toNumber()
          } as any);
          remainingToAssign = remainingToAssign.minus(amountFromThisLot);
        }
      }

      if (remainingToAssign.gt(0.0001)) {
        toast.warning(`Não foi possível alocar toda a quantidade nos lotes existentes. Faltam ${remainingToAssign.toFixed(4)}g`);
      }
    }

    const newItem = {
      ...newItemData,
      lots: assignedLots,
    };
    setItems(currentItems => [...currentItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof any, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  }

  const openLotSelector = (itemIndex: number) => {
    const item = items[itemIndex];
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      toast.error("Selecione um produto para o item antes de escolher os lotes.");
      return;
    }
    setItemToSelectLots({ product, itemIndex });
    setIsLotModalOpen(true);
  };

  const handleLotsSelected = (selectedLots: SaleItemLot[]) => {
    if (itemToSelectLots === null) return;
    const { itemIndex } = itemToSelectLots;

    const updatedItems = [...items];
    updatedItems[itemIndex].lots = selectedLots;

    // Auto-update total quantity based on selected lots if product is not service/reaction
    // But usually we want quantity to match lots sum
    const totalLotQty = selectedLots.reduce((acc, lot) => acc + lot.quantity, 0);
    // Use toFixed to avoid 100.000000000001 issues
    updatedItems[itemIndex].quantity = parseFloat(totalLotQty.toFixed(2));

    setItems(updatedItems);

    setItemToSelectLots(null);
  };

  const totalAmount = useMemo(
    () => items.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
    [items]
  );
  const feeAmount = useMemo(
    () => totalAmount * (feePercentage / 100),
    [totalAmount, feePercentage]
  );
  const finalAmount = useMemo(
    () => (absorbCreditCardFee ? totalAmount : totalAmount + feeAmount) + freightAmount,
    [totalAmount, feeAmount, absorbCreditCardFee, freightAmount]
  );

  const handleCheckOrderNumber = async (event: React.FocusEvent<HTMLInputElement>) => {
    const orderNumber = event.target.value;
    if (!orderNumber) {
      clearErrors("orderNumber");
      return;
    }
    try {
      const response = await api.get(`/sales/check-order-number/${orderNumber}`);
      if (response.data.exists) {
        setError("orderNumber", { type: "manual", message: "Este número de pedido já está em uso." });
      } else {
        clearErrors("orderNumber");
      }
    } catch (error) {
      // Don't set an error if the check fails, but you might want to log it
      console.error("Falha ao verificar o número do pedido:", error);
    }
  };

  const onFinalizeSale = async (formData: any) => {
    if (items.length === 0) return toast.error("Adicione pelo menos um item à venda.");
    if (items.some(item => !item.productId)) return toast.error("Todos os itens devem ter um produto selecionado.");

    const isAVista = selectedPaymentCondition?.label.toLowerCase().includes('vista');
    if (isAVista && !formData.contaCorrenteId) return toast.error("Para vendas à vista, selecione a conta de destino.");

    setIsSubmitting(true);

    let paymentMethod = 'A_PRAZO';
    let paymentTermId = null;

    if (selectedPaymentCondition) {
      if (selectedPaymentCondition.value === 'CREDIT_CARD') {
        paymentMethod = 'CREDIT_CARD';
      } else if (selectedPaymentCondition.value === 'METAL') {
        paymentMethod = 'METAL';
      } else if (selectedPaymentCondition.value === 'A_COMBINAR') {
        paymentMethod = 'A_COMBINAR';
      } else if (selectedPaymentCondition.isTerm) {
        paymentTermId = selectedPaymentCondition.value;
        paymentMethod = selectedPaymentCondition.label.toLowerCase().includes('vista') ? 'A_VISTA' : 'A_PRAZO';
      }
    }

    // Determinar qual cotação enviar (preferência Ouro, senão Prata)
    const hasGoldItems = items.some(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.name.toLowerCase().includes('el sal') || product?.productGroup?.name.toLowerCase().includes('auro');
    });
    const hasSilverItems = items.some(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.name.toLowerCase().includes('ag') || product?.name.toLowerCase().includes('prata');
    });

    let effectiveQuote = saleGoldQuote;
    if (hasSilverItems && !hasGoldItems) {
      effectiveQuote = saleSilverQuote;
    }

    const payload: any = {
      pessoaId: formData.clientId,
      items: items.map(({ productId, quantity, price, lots, laborPercentage, entryUnit, entryQuantity }) => ({
        productId,
        quantity: Number(quantity.toFixed(2)),
        price: Number(price.toFixed(2)),
        lots,
        laborPercentage,
        entryUnit,
        entryQuantity,
      })),
      feeAmount: totalAmount * (feePercentage / 100),
      freightAmount: freightAmount,
      paymentMethod,
      goldQuoteValue: effectiveQuote,
      numberOfInstallments: formData.numberOfInstallments,
      contaCorrenteId: formData.contaCorrenteId,
      createdAt: saleDate?.toISOString(),
      orderNumber: formData.orderNumber,
      observation: formData.observation,
    };

    if (paymentMethod === 'A_PRAZO' && paymentTermId) {
      payload.paymentTermId = paymentTermId;
    }

    try {
      await api.post("/sales", payload);
      toast.success("Venda realizada com sucesso!");
      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao finalizar a venda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFinalizeSale)}
      className="flex flex-col h-full bg-background min-h-0"
    >
      <AddItemModal
        open={isAddItemModalOpen}
        onOpenChange={setIsAddItemModalOpen}
        products={products}
        items={items}
        onAddItem={handleAddItem}
        saleGoldQuote={saleGoldQuote}
        saleSilverQuote={saleSilverQuote}
        laborCostTable={laborCostTable}
      />
      {itemToSelectLots && (
        <LotSelectionModal
          isOpen={isLotModalOpen}
          onClose={() => setIsLotModalOpen(false)}
          product={itemToSelectLots.product}
          quantityRequired={items[itemToSelectLots.itemIndex].quantity}
          existingLots={items[itemToSelectLots.itemIndex].lots}
          onLotsSelected={handleLotsSelected}
        />
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-1">
        {/* Coluna Esquerda: Dados da Venda */}
        <div className="w-full lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:overflow-y-auto lg:pr-2">
          <Card className="border shadow-sm">
            <CardHeader className="p-3.5 pb-2 border-b bg-muted/10">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                1. Dados da Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 p-3.5 pt-3">
              {/* Cliente */}
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Cliente *</Label>
                    <Combobox
                      options={clients.map((c) => ({ value: c.id, label: c.name }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Buscar ou selecionar cliente..."
                    />
                    <p className="text-[11px] text-destructive">{typeof errors.clientId?.message === "string" ? errors.clientId.message : ""}</p>
                  </div>
                )}
              />

              {/* Data da Venda e Nº Pedido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data da Venda</Label>
                  <Input
                    type="date"
                    className="h-9 text-xs"
                    value={saleDate ? saleDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setSaleDate(e.target.value ? new Date(e.target.value + 'T12:00:00') : undefined)}
                  />
                </div>
                <Controller
                  name="orderNumber"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Nº Pedido (Opcional)</Label>
                      <Input
                        {...field}
                        type="number"
                        className="h-9 text-xs"
                        placeholder="Automático"
                        onBlur={handleCheckOrderNumber}
                      />
                      <p className="text-[11px] text-destructive">{typeof errors.orderNumber?.message === "string" ? errors.orderNumber.message : ""}</p>
                    </div>
                  )}
                />
              </div>

              {/* Condição de Pagamento */}
              <Controller
                name="paymentConditionId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Condição de Pagamento *</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione a condição..." /></SelectTrigger>
                      <SelectContent>
                        {paymentOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-destructive">{typeof errors.paymentConditionId?.message === "string" ? errors.paymentConditionId.message : ""}</p>
                  </div>
                )}
              />

              {/* Parcelamento Cartão (Condicional) */}
              {paymentConditionId === "CREDIT_CARD" && (
                <Controller
                  name="numberOfInstallments"
                  control={control}
                  render={({ field }) => (
                    <div className="p-2.5 bg-muted/30 rounded-lg border space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-primary" /> Parcelamento (Cartão)
                      </Label>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value?.toString() || "1"}
                      >
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione as parcelas..." /></SelectTrigger>
                        <SelectContent>
                          {fees.length > 0 ? (
                            fees.map((feeRule) => (
                              <SelectItem key={feeRule.id} value={feeRule.installments.toString()}>
                                {feeRule.installments}x ({Number(feeRule.feePercentage).toFixed(2)}% de taxa)
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="1" disabled>Cadastre as taxas</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              )}

              {/* Conta Corrente (Condicional À Vista) */}
              {currentPaymentMethod === 'A_VISTA' && (
                <Controller
                  name="contaCorrenteId"
                  control={control}
                  render={({ field }) => (
                    <div className="p-2.5 bg-muted/30 rounded-lg border space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" /> Receber em (Conta Corrente)
                      </Label>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione a conta..." /></SelectTrigger>
                        <SelectContent>
                          {contasCorrentes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-destructive">{typeof errors.contaCorrenteId?.message === "string" ? errors.contaCorrenteId.message : ""}</p>
                    </div>
                  )}
                />
              )}

              {/* Cotações do Dia & Frete */}
              <div className="p-3 bg-muted/20 rounded-lg border space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-500" /> Cotações do Dia & Frete
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Ouro (R$/g)</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs font-medium"
                      value={saleGoldQuote}
                      onChange={(e) => setSaleGoldQuote(Number(e.target.value))}
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Prata (R$/g)</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs font-medium"
                      value={saleSilverQuote}
                      onChange={(e) => setSaleSilverQuote(Number(e.target.value))}
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Frete (R$)</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs font-medium"
                      value={freightAmount}
                      onChange={(e) => setFreightAmount(Number(e.target.value))}
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <Controller
                name="observation"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Observações</Label>
                    <Textarea
                      {...field}
                      placeholder="Observações adicionais da venda..."
                      className="resize-none h-16 text-xs"
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Itens da Venda e Fechamento */}
        <div className="w-full lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 h-full">
          <Card className="flex-1 flex flex-col min-h-0 border rounded-xl overflow-hidden shadow-sm bg-card">
            <CardHeader className="p-3.5 md:p-4 border-b flex-row items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">2. Itens da Venda</CardTitle>
                <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </Badge>
              </div>
              <Button type="button" size="sm" onClick={handleAddNewItem} className="gap-1.5 shadow-sm">
                <PlusCircle className="h-4 w-4" />
                Adicionar Item
              </Button>
            </CardHeader>

            <CardContent className="flex-1 p-0 min-h-0 overflow-y-auto">
              {items.length > 0 ? (
                <div className="min-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[38%]">Produto</TableHead>
                        <TableHead className="w-[14%] text-center">Qtd</TableHead>
                        <TableHead className="w-[18%] text-right">Preço Unit.</TableHead>
                        <TableHead className="w-[12%] text-center">Lotes</TableHead>
                        <TableHead className="w-[14%] text-right">Subtotal</TableHead>
                        <TableHead className="w-[4%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="py-2.5">
                            <span className="font-medium text-sm text-foreground block">{item.name}</span>
                            {item.laborPercentage !== undefined && (
                              <span className="inline-block mt-0.5 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                Mão de obra: {item.laborPercentage}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateItem(index, 'quantity', val === '' ? 0 : parseFloat(val));
                              }}
                              className="w-20 mx-auto h-8 text-xs text-center font-medium"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell className="text-right py-2.5">
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateItem(index, 'price', val === '' ? 0 : parseFloat(val));
                              }}
                              className="w-24 ml-auto h-8 text-xs text-right font-medium"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <Button
                              type="button"
                              variant={item.lots?.length > 0 ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => openLotSelector(index)}
                              className="h-8 px-2.5 text-xs gap-1.5 font-medium"
                              title="Gerenciar lotes do item"
                            >
                              <PackageSearch className="h-3.5 w-3.5" />
                              <span>{item.lots?.length || 0}</span>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm py-2.5">
                            {formatCurrency(item.price * item.quantity)}
                          </TableCell>
                          <TableCell className="py-2.5 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[260px] p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <PackageSearch className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">Nenhum item adicionado à venda</p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                    Clique no botão abaixo para selecionar os produtos, definir quantidades e associar lotes.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddNewItem} className="gap-2 text-xs">
                    <PlusCircle className="h-3.5 w-3.5 text-primary" /> Adicionar Primeiro Item
                  </Button>
                </div>
              )}
            </CardContent>

            {/* Fechamento Financeiro & Botão Salvar Integrado */}
            <div className="border-t bg-muted/15 p-3.5 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <div>
                  Subtotal: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
                </div>
                {feeAmount > 0 && (
                  <div>
                    Taxa Cartão ({feePercentage.toFixed(2)}%):{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(feeAmount)}
                      {absorbCreditCardFee && " (Absorvida)"}
                    </span>
                  </div>
                )}
                <div>
                  Frete: <span className="font-semibold text-foreground">{formatCurrency(freightAmount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-5 pt-2 md:pt-0 border-t md:border-t-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Total Geral
                  </span>
                  <span className="text-2xl md:text-3xl font-black text-primary tracking-tight">
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin" />
                      <span>Finalizando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                      <span>Salvar Venda</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
