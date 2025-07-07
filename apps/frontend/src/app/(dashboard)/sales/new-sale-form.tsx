"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";

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
interface Client {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}
interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  stock: number;
}
interface ContaCorrente {
  id: string;
  nome: string;
  numeroConta: string;
}

// ✅ FUNÇÃO DE FORMATAÇÃO ADICIONADA AQUI
const formatCurrency = (value?: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

interface NewSaleFormProps {
  onSave: () => void;
}

export function NewSaleForm({ onSave }: NewSaleFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);

  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientId: "",
      paymentMethod: "",
      numberOfInstallments: 2,
      contaCorrenteId: null,
    },
  });
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, productsRes, contasCorrentesRes] = await Promise.all(
          [
            api.get("/clients"),
            api.get("/products"),
            api.get("/contas-correntes"),
          ]
        );
        setClients(clientsRes.data);
        setProducts(productsRes.data);
        setContasCorrentes(contasCorrentesRes.data);
      } catch (error) {
        toast.error("Falha ao carregar dados para a venda.");
      }
    }
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error("Selecione um produto e uma quantidade válida.");
      return;
    }
    if (quantity > selectedProduct.stock) {
      toast.error(`Estoque insuficiente. Disponível: ${selectedProduct.stock}`);
      return;
    }
    const existingItemIndex = items.findIndex(
      (item) => item.productId === selectedProduct.id
    );
    if (existingItemIndex > -1) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: quantity,
          price: selectedProduct.price,
          stock: selectedProduct.stock,
        },
      ]);
    }
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  const onFinalizeSale = async (formData) => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item à venda.");
      return;
    }
    if (formData.paymentMethod === "À Vista" && !formData.contaCorrenteId) {
      toast.error("Para vendas à vista, selecione a conta de destino.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      items: items.map(({ productId, quantity, price }) => ({
        productId,
        quantity,
        price,
      })),
      totalAmount,
    };

    try {
      await api.post("/sales", payload);
      toast.success("Venda realizada com sucesso!");
      onSave();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao finalizar a venda."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFinalizeSale)}
      className="flex flex-col h-full"
    >
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        <div className="lg:col-span-1 space-y-4 p-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Dados da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="clientId"
                rules={{ required: "Selecione um cliente" }}
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Cliente</Label>
                    <Combobox
                      options={clients.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Selecione um cliente..."
                    />
                    {errors.clientId && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.clientId.message?.toString()}
                      </p>
                    )}
                  </div>
                )}
              />
              <Controller
                name="paymentMethod"
                rules={{ required: "Selecione a forma de pagamento" }}
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Forma de Pagamento</Label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="À Vista">À Vista</SelectItem>
                        <SelectItem value="A Prazo">A Prazo</SelectItem>
                        <SelectItem value="Credit Card">
                          Cartão de Crédito
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.paymentMethod && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.paymentMethod.message?.toString()}
                      </p>
                    )}
                  </div>
                )}
              />
              {paymentMethod === "A Prazo" && (
                <Controller
                  name="numberOfInstallments"
                  control={control}
                  defaultValue={2}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label>Número de Parcelas</Label>
                      <Input
                        type="number"
                        min="2"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </div>
                  )}
                />
              )}
              {paymentMethod === "À Vista" && (
                <Controller
                  name="contaCorrenteId"
                  control={control}
                  rules={{ required: "Conta de destino é obrigatória" }}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label>Receber em (Conta Corrente)</Label>
                      <Combobox
                        options={contasCorrentes.map((c) => ({
                          value: c.id,
                          label: `${c.nome} (${c.numeroConta})`,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Selecione a conta de destino..."
                      />
                      {errors.contaCorrenteId && (
                        <p className="text-sm font-medium text-destructive">
                          {errors.contaCorrenteId.message?.toString()}
                        </p>
                      )}
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Adicionar Produtos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-end">
              <div className="sm:col-span-4">
                <Label>Produto</Label>
                <Combobox
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.name} (Estoque: ${p.stock})`,
                  }))}
                  value={selectedProduct?.id}
                  onValueChange={(value) =>
                    setSelectedProduct(
                      products.find((p) => p.id === value) || null
                    )
                  }
                  placeholder="Pesquise um produto..."
                />
              </div>
              <div className="sm:col-span-1">
                <Label>Qtd.</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="sm:col-span-1">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full"
                >
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">3. Itens da Venda</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[250px] lg:h-full">
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
                        <TableRow key={item.productId}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.price * item.quantity)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.productId)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          Nenhum item adicionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <div className="flex justify-end text-xl font-bold p-4 border-t">
              <span>Total: {formatCurrency(totalAmount)}</span>
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
