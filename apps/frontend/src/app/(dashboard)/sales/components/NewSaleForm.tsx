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
import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Interfaces ---
interface Client { id: string; name: string; }
interface InventoryLot { id: string; remainingQuantity: number; sourceType: string; }
interface Product { id: string; name: string; price: number; stock: number; inventoryLots: InventoryLot[] }
interface SaleItem { productId: string; name: string; quantity: number; price: number; stock: number; inventoryLotId?: string; }
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
});

export function NewSaleForm({ onSave }: any) {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feePercentage, setFeePercentage] = useState(0);
  const [absorbCreditCardFee, setAbsorbCreditCardFee] = useState(false);
  const [latestGoldQuote, setLatestGoldQuote] = useState<any>(null);
  const [saleGoldQuote, setSaleGoldQuote] = useState(0);
  const [laborCostTable, setLaborCostTable] = useState<any[]>([]);
  const [laborGramsInput, setLaborGramsInput] = useState<number | string>(0);

  // States for unit conversion
  const [entryUnit, setEntryUnit] = useState('sal'); // 'sal' or 'au'
  const [entryQuantity, setEntryQuantity] = useState<number | string>(1);

  const GOLD_SALT_PRODUCT_NAME = 'El Sal 68%';
  const GOLD_SALT_CONVERSION_RATE = 1.47;

  const isGoldSaltProduct = useMemo(() => 
    selectedProduct?.name.includes(GOLD_SALT_PRODUCT_NAME), 
    [selectedProduct]
  );



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

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, productsRes, contasRes, feesRes, orgSettingsRes, paymentTermsRes, quoteRes, laborTableRes] = await Promise.all([
          api.get("/pessoas?role=client"),
          api.get("/products"),
          api.get("/contas-correntes"),
          api.get("/credit-card-fees"),
          api.get("/settings/organization"),
          api.get("/payment-terms"),
          api.get("/quotations/latest?metal=AU"),
          api.get("/labor-cost-table-entries"),
        ]);
        setClients(clientsRes.data.map((c: any) => ({ id: c.id, name: c.name })));
        setProducts(productsRes.data);
        console.log("Fetched Products:", productsRes.data);
        setContasCorrentes(contasRes.data);
        setFees(feesRes.data);
        setAbsorbCreditCardFee(orgSettingsRes.data.absorbCreditCardFee);
        setPaymentTerms(paymentTermsRes.data);
        setLaborCostTable(laborTableRes.data);
        setLatestGoldQuote(quoteRes.data);
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

  const goldAmount = useMemo(() => {
    if (!isGoldSaltProduct) return 0;
    const quant = typeof entryQuantity === 'string' ? parseFloat(entryQuantity) : entryQuantity;
    if (isNaN(quant)) return 0;
    return entryUnit === 'au' ? quant : quant / GOLD_SALT_CONVERSION_RATE;
  }, [entryQuantity, entryUnit, isGoldSaltProduct]);

  const laborGramsCharged = useMemo(() => {
    if (!isGoldSaltProduct || goldAmount <= 0) return 0;

    const entry = laborCostTable.find(e => 
      goldAmount >= e.minGrams && (e.maxGrams === null || goldAmount <= e.maxGrams)
    );

    return entry ? entry.goldGramsCharged : 0;
  }, [goldAmount, isGoldSaltProduct, laborCostTable]);

  useEffect(() => {
    setLaborGramsInput(laborGramsCharged);
  }, [laborGramsCharged]);

  const totalGoldAmount = useMemo(() => {
    const laborGrams = typeof laborGramsInput === 'string' ? parseFloat(laborGramsInput) : (laborGramsInput || 0);
    return goldAmount + laborGrams;
  }, [goldAmount, laborGramsInput]);

  const finalQuantity = useMemo(() => {
    const quant = typeof entryQuantity === 'string' ? parseFloat(entryQuantity) : entryQuantity;
    if (isNaN(quant)) return 0;

    if (isGoldSaltProduct) {
      if (entryUnit === 'au') {
        return quant * GOLD_SALT_CONVERSION_RATE;
      }
      return quant;
    }

    return quant;
  }, [entryQuantity, entryUnit, isGoldSaltProduct]);

  const calculatedItemPrice = useMemo(() => {
    if (!selectedProduct) return 0;

    if (isGoldSaltProduct) {
      if (!saleGoldQuote || saleGoldQuote <= 0) return 0;
      if (goldAmount <= 0) return 0;

      const laborGrams = typeof laborGramsInput === 'string' ? parseFloat(laborGramsInput) : laborGramsInput;
      if (isNaN(laborGrams)) return 0;

      const goldWithLabor = goldAmount + laborGrams;
      const totalBRL = goldWithLabor * saleGoldQuote;
      
      // The price is per unit of SAL, so we divide the total BRL value by the final quantity in SAL
      if (finalQuantity === 0) return 0; // Avoid division by zero
      return totalBRL / finalQuantity;
    } else {
      return Number(selectedProduct.price);
    }
  }, [selectedProduct, isGoldSaltProduct, saleGoldQuote, goldAmount, laborGramsInput, finalQuantity]);

  useEffect(() => {
    setItemPrice(calculatedItemPrice);
  }, [calculatedItemPrice]);

  const handleAddItem = () => {
    if (!selectedProduct || finalQuantity <= 0 || calculatedItemPrice <= 0) {
      toast.error("Selecione um produto, quantidade e preço válidos.");
      return;
    }

    const isManufactured = selectedProduct.inventoryLots.some(lot => lot.sourceType === 'REACTION');
    if (isManufactured && !selectedLot) {
      toast.error("Para produtos manufaturados, selecione um lote.");
      return;
    }

    const lot = selectedProduct.inventoryLots.find(l => l.id === selectedLot);
    const stockAvailable = isManufactured ? (lot?.remainingQuantity || 0) : selectedProduct.stock;

    if (finalQuantity > stockAvailable) {
      toast.error(`Estoque insuficiente. Disponível: ${stockAvailable}`);
      return;
    }

    const existingItem = items.find(
      (item) => item.productId === selectedProduct.id && item.inventoryLotId === selectedLot
    );

    if (existingItem) {
      setItems(
        items.map((item) =>
          item.productId === selectedProduct.id && item.inventoryLotId === selectedLot
            ? { ...item, quantity: item.quantity + finalQuantity }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: finalQuantity,
          price: calculatedItemPrice,
          stock: stockAvailable,
          inventoryLotId: selectedLot || undefined,
        },
      ]);
    }
    setSelectedProduct(null);
    setSelectedLot(null);
    setEntryQuantity(1);
    setItemPrice(0);
  };

  const handleRemoveItem = (productId: string, inventoryLotId?: string) =>
    setItems(items.filter((item) => !(item.productId === productId && item.inventoryLotId === inventoryLotId)));

  const totalAmount = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  const feeAmount = useMemo(
    () => totalAmount * (feePercentage / 100),
    [totalAmount, feePercentage]
  );
  const finalAmount = useMemo(
    () => (absorbCreditCardFee ? totalAmount : totalAmount + feeAmount),
    [totalAmount, feeAmount, absorbCreditCardFee]
  );

  const onFinalizeSale = async (formData: any) => {
    if (items.length === 0) return toast.error("Adicione pelo menos um item à venda.");
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
        if (selectedPaymentCondition.label.toLowerCase().includes('vista')) {
          paymentMethod = 'A_VISTA';
        }
      }
    }

    const payload = {
      pessoaId: formData.clientId,
      items: items.map(({ productId, quantity, price, inventoryLotId }) => ({ productId, quantity, price, inventoryLotId })),
      feeAmount: totalAmount * (feePercentage / 100),
      paymentMethod,
      paymentTermId,
      goldQuoteValue: saleGoldQuote, // Adicionado
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
              {selectedPaymentCondition && selectedPaymentCondition.label.toLowerCase().includes('vista') && (
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
                          ))}
                        </SelectContent>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Adicionar Produtos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-4">
                <Label>Produto</Label>
                <Combobox
                  options={products.map((p) => ({ value: p.id, label: `${p.name} (Estoque: ${p.stock})` }))}
                  value={selectedProduct?.id}
                  onChange={(value) => {
                    const product = products.find((p) => p.id === value) || null;
                    setSelectedProduct(product);
                    setEntryUnit('sal'); // Reset to default unit on product change
                    setEntryQuantity(1);
                  }}
                  placeholder="Pesquise..."
                />
              </div>

              {isGoldSaltProduct ? (
                <>
                  <div className="sm:col-span-2">
                    <Label>Qtd. Lançada</Label>
                    <Input
                      type="number"
                      value={entryQuantity}
                      onChange={(e) => setEntryQuantity(e.target.value)}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label>Unidade</Label>
                    <Select onValueChange={setEntryUnit} value={entryUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sal">g Sal</SelectItem>
                        <SelectItem value="au">g Au</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Mão de Obra (g)</Label>
                    <Input 
                      type="number"
                      value={laborGramsInput}
                      onChange={(e) => setLaborGramsInput(e.target.value)}
                      step="0.01"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Total Ouro (g)</Label>
                    <Input type="number" value={totalGoldAmount.toFixed(4)} readOnly disabled className="font-bold" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Qtd. Final (Sal)</Label>
                    <Input type="number" value={finalQuantity.toFixed(4)} readOnly disabled />
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-3">
                    <Label>Preço Unit.</Label>
                    <Input type="number" value={itemPrice} onChange={(e) => setItemPrice(Number(e.target.value))} min="0" step="0.01" />
                  </div>
                  <div className="sm:col-span-3">
                    <Label>Qtd.</Label>
                    <Input type="number" value={entryQuantity} onChange={(e) => setEntryQuantity(Number(e.target.value))} min="1" />
                  </div>
                </>
              )}

              {selectedProduct && selectedProduct.inventoryLots.some(lot => lot.sourceType === 'REACTION') && (
                <div className="sm:col-span-2">
                  <Label>Lote de Produção</Label>
                  <Select onValueChange={setSelectedLot} value={selectedLot || ""}>
                    <SelectTrigger><SelectValue placeholder="Selecione o lote..." /></SelectTrigger>
                    <SelectContent>
                      {selectedProduct.inventoryLots
                        .filter(lot => (lot.sourceType === 'REACTION' || lot.sourceType === 'MANUAL_ADJUSTMENT') && lot.remainingQuantity > 0)
                        .map(lot => (
                          <SelectItem key={lot.id} value={lot.id}>
                            Lote #{lot.id.substring(0, 8)} (Disponível: {lot.remainingQuantity})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="sm:col-span-2">
                <Button type="button" onClick={handleAddItem} className="w-full">Adicionar</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">3. Itens da Venda</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length > 0 ? (
                      items.map((item) => (
                        <TableRow key={`${item.productId}-${item.inventoryLotId || 'stock'}`}>
                          <TableCell>{item.name}{item.inventoryLotId && ` (Lote: ${item.inventoryLotId.substring(0,8)})`}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId, item.inventoryLotId)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">Nenhum item adicionado</TableCell>
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
