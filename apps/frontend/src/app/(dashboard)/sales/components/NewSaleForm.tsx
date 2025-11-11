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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { PlusCircle, Trash2, PackageSearch } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LotSelectionModal } from "@/components/sales/LotSelectionModal";
import { Product } from "@/types/product";
import { SaleItem, SaleItemLot } from "@/types/sale";
import { InventoryLot } from "@/types/inventory-lot";

// --- Interfaces ---
interface Client { id: string; name: string; }
interface ContaCorrente { id: string; nome: string; }
interface Fee { id: string; installments: number; feePercentage: number; }
interface PaymentTerm { id:string; name: string; installmentsDays: number[]; interestRate?: number; }

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const formSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  paymentConditionId: z.string().min(1, "Selecione a condição de pagamento."),
  numberOfInstallments: z.coerce.number().int().min(1).optional(),
  contaCorrenteId: z.string().nullable().optional(),
});

export function NewSaleForm({ onSave }: any) {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feePercentage, setFeePercentage] = useState(0);
  const [absorbCreditCardFee, setAbsorbCreditCardFee] = useState(false);
  const [saleGoldQuote, setSaleGoldQuote] = useState(0);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [itemToSelectLots, setItemToSelectLots] = useState<{ product: Product, itemIndex: number } | null>(null);
  const [freightAmount, setFreightAmount] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: { clientId: "", paymentConditionId: "", numberOfInstallments: 1, contaCorrenteId: null },
  });
  const paymentConditionId = watch("paymentConditionId");
  const numberOfInstallments = watch("numberOfInstallments");

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

  const currentPaymentMethod = useMemo(() => {
    if (!selectedPaymentCondition) return null;
    if (selectedPaymentCondition.value === 'CREDIT_CARD') return 'CREDIT_CARD';
    if (selectedPaymentCondition.value === 'METAL') return 'METAL';
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
    async function fetchData() {
      try {
        const [clientsRes, productsRes, contasRes, feesRes, orgSettingsRes, paymentTermsRes, quoteRes] = await Promise.all([
          api.get("/pessoas?role=CLIENT"),
          api.get("/products"),
          api.get("/contas-correntes"),
          api.get("/credit-card-fees"),
          api.get("/settings/organization"),
          api.get("/payment-terms"),
          api.get("/quotations/latest?metal=AU"),
        ]);
        setClients(clientsRes.data.map((c: any) => ({ id: c.id, name: c.name })));
        setProducts(productsRes.data);
        setContasCorrentes(contasRes.data);
        setFees(feesRes.data);
        setAbsorbCreditCardFee(orgSettingsRes.data.absorbCreditCardFee);
        setPaymentTerms(paymentTermsRes.data);
        if (quoteRes.data?.sellPrice) {
          setSaleGoldQuote(quoteRes.data.sellPrice);
          toast.info(`Cotação do Ouro carregada: ${formatCurrency(quoteRes.data?.sellPrice)}`);
        }
      } catch (error) {
        toast.error("Falha ao carregar dados para a venda.");
      }
    }
    fetchData();
  }, []);

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
    const newItem: SaleItem = {
      productId: '',
      name: 'Novo Item',
      quantity: 1,
      price: 0,
      lots: [],
    };
    setItems(currentItems => [...currentItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof SaleItem, value: any) => {
    const updatedItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index] = {
          ...updatedItems[index],
          productId: product.id,
          name: product.name,
          price: product.price,
          lots: [], // Reset lots when product changes
        };
      }
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }
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
    setItems(updatedItems);
    
    setItemToSelectLots(null);
  };

  const totalAmount = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
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

  const onFinalizeSale = async (formData: any) => {
    if (items.length === 0) return toast.error("Adicione pelo menos um item à venda.");
    if (items.some(item => !item.productId)) return toast.error("Todos os itens devem ter um produto selecionado.");
    if (items.some(item => item.lots.length === 0)) return toast.error("Todos os itens devem ter lotes selecionados.");

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
      } else if (selectedPaymentCondition.isTerm) {
        paymentTermId = selectedPaymentCondition.value;
        paymentMethod = selectedPaymentCondition.label.toLowerCase().includes('vista') ? 'A_VISTA' : 'A_PRAZO';
      }
    }

    const payload = {
      pessoaId: formData.clientId,
      items: items.map(({ productId, quantity, price, lots }) => ({
        productId,
        quantity,
        price,
        lots,
      })),
      feeAmount: totalAmount * (feePercentage / 100),
      freightAmount: freightAmount,
      paymentMethod,
      paymentTermId,
      goldQuoteValue: saleGoldQuote,
      numberOfInstallments: formData.numberOfInstallments,
      contaCorrenteId: formData.contaCorrenteId,
    };

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
      className="flex flex-col h-full bg-background p-1 rounded-lg"
    >
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
      <div className="flex flex-col lg:flex-row flex-1 gap-4">
        <div className="w-full lg:w-1/3 space-y-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">1. Dados da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Cliente</Label>
                    <Combobox
                      options={clients.map((c) => ({ value: c.id, label: c.name }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione..."
                    />
                    <p className="text-sm text-destructive">{typeof errors.clientId?.message === "string" ? errors.clientId.message : ""}</p>
                  </div>
                )}
              />
              <Controller
                name="paymentConditionId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Condição de Pagamento</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {paymentOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-destructive">{typeof errors.paymentConditionId?.message === "string" ? errors.paymentConditionId.message : ""}</p>
                  </div>
                )}
              />
              <div className="space-y-1">
                <Label>Cotação do Ouro (Venda)</Label>
                <Input
                  type="number"
                  value={saleGoldQuote}
                  onChange={(e) => setSaleGoldQuote(Number(e.target.value))}
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label>Frete (R$)</Label>
                <Input
                  type="number"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(Number(e.target.value))}
                  step="0.01"
                />
              </div>
              {paymentConditionId === "CREDIT_CARD" && (
                <Controller
                  name="numberOfInstallments"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label>Parcelamento (Cartão)</Label>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value?.toString() || "1"}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
              {currentPaymentMethod === 'A_VISTA' && (
                <Controller
                  name="contaCorrenteId"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label>Receber em</Label>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {contasCorrentes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                          ))}</SelectContent>
                      </Select>
                      <p className="text-sm text-destructive">{typeof errors.contaCorrenteId?.message === "string" ? errors.contaCorrenteId.message : ""}</p>
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="w-full lg:w-2/3 space-y-4 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Itens da Venda</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddNewItem}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Item
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Produto</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Lotes</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Combobox
                              options={products.map(p => ({ value: p.id, label: p.name }))}
                              value={item.productId}
                              onChange={(value) => handleUpdateItem(index, 'productId', value)}
                              placeholder="Selecione um produto"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-24"
                              step="0.0001"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-24"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="outline" size="sm" onClick={() => openLotSelector(index)}>
                              <PackageSearch className="mr-2 h-4 w-4" />
                              ({item.lots.length})
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-full">
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p>Nenhum item adicionado.</p>
                            <p className="text-sm">Clique em "Adicionar Item" para começar.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <div className="flex flex-col space-y-2 text-right p-4 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              {feeAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Taxa do Cartão ({feePercentage.toFixed(2)}%)
                    {absorbCreditCardFee && " (Absorvida pela empresa)"}
                  </span>
                  <span>{formatCurrency(feeAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatCurrency(freightAmount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(finalAmount)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Finalizando..." : "Salvar Venda"}
        </Button>
      </div>
    </form>
  );
}
