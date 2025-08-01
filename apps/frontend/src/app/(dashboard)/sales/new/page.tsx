"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormCombobox } from "@/components/ui/FormCombobox";
import { Trash2, PlusCircle } from "lucide-react";

// Interfaces
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
  quantity: number;
  unitPrice: number;
}
interface ContaCorrente {
  id: string;
  nome: string;
}

// Função para formatar valores em moeda BRL
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function CreateSalePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Estados do formulário
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [feePercentage, setFeePercentage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [selectedContaCorrenteId, setSelectedContaCorrenteId] = useState<
    string | null
  >(null);

  // Efeito para carregar dados da página
  useEffect(() => {
    if (!authLoading && user) {
      const loadPageData = async () => {
        setIsPageLoading(true);
        try {
          const [clientsRes, productsRes, contasRes] = await Promise.all([
            api.get("/clients"),
            api.get("/products"),
            api.get("/contas-correntes"),
          ]);
          setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
          setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
          setContasCorrentes(
            Array.isArray(contasRes.data) ? contasRes.data : []
          );
        } catch (error) {
          toast.error("Falha ao carregar dados da página.");
        } finally {
          setIsPageLoading(false);
        }
      };
      loadPageData();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Efeito para definir a taxa padrão do cartão
  useEffect(() => {
    if (paymentMethod === "CREDIT_CARD") {
      setFeePercentage(5);
    } else {
      setFeePercentage(0);
    }
  }, [paymentMethod]);

  // Funções de manipulação de itens
  const handleItemChange = (
    index: number,
    field: keyof SaleItem,
    value: any
  ) => {
    const newItems = [...saleItems];
    const currentItem = { ...newItems[index] };
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      currentItem.productId = value;
      currentItem.unitPrice = product ? Number(product.price) : 0;
    } else if (field === "quantity") {
      currentItem.quantity = Number(value) >= 1 ? Number(value) : 1;
    }
    newItems[index] = currentItem;
    setSaleItems(newItems);
  };

  const handleAddItem = () =>
    setSaleItems([...saleItems, { productId: "", quantity: 1, unitPrice: 0 }]);
  const handleRemoveItem = (index: number) =>
    setSaleItems(saleItems.filter((_, i) => i !== index));

  // Cálculos de valores (Subtotal, Taxa, Total Final)
  const totalSaleAmount = useMemo(
    () =>
      saleItems.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0
      ),
    [saleItems]
  );
  const feeAmount = useMemo(() => {
    return totalSaleAmount * (feePercentage / 100);
  }, [totalSaleAmount, feePercentage]);
  const finalAmount = useMemo(() => {
    return totalSaleAmount + feeAmount;
  }, [totalSaleAmount, feeAmount]);

  // Função de envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      !selectedClient ||
      !paymentMethod ||
      saleItems.some((item) => !item.productId || item.quantity <= 0)
    ) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      setIsSubmitting(false);
      return;
    }
    if (paymentMethod === "A_VISTA" && !selectedContaCorrenteId) {
      toast.error("Para vendas à vista, selecione a conta de destino.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      clientId: selectedClient,
      items: saleItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      paymentMethod,
      installmentsCount: paymentMethod === "A_PRAZO" ? installmentsCount : 1,
      feeAmount: feeAmount,
      contaCorrenteId: selectedContaCorrenteId,
    };

    try {
      await api.post("/sales", payload);
      toast.success("Venda criada com sucesso!");
      router.push("/sales");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Ocorreu um erro ao criar a venda.";
      toast.error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isPageLoading) {
    return <p className="text-center p-10">Carregando...</p>;
  }

  return (
    <Card className="mx-auto my-8 max-w-4xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Criar Nova Venda</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client" className="font-semibold">
              Cliente
            </Label>
            <FormCombobox
              value={selectedClient}
              items={(clients || []).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              onSelect={(value) => setSelectedClient(value)}
              searchPlaceholder="Buscar cliente..."
              notFoundText="Nenhum cliente encontrado."
              triggerPlaceholder="Selecione um cliente"
            />
          </div>
          {/* Itens da Venda */}
          <div className="space-y-4">
            <Label className="font-semibold">Itens da Venda</Label>
            {saleItems.map((item, index) => (
              <div
                key={index}
                className="flex items-end gap-2 p-2 border rounded-md"
              >
                <div className="flex-grow">
                  <Label htmlFor={`product-${index}`}>Produto</Label>
                  <Select
                    onValueChange={(value) =>
                      handleItemChange(index, "productId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label htmlFor={`quantity-${index}`}>Qtd.</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    min="1"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  disabled={saleItems.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </div>

          {/* Bloco de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A_VISTA">À Vista</SelectItem>
                  <SelectItem value="A_PRAZO">A Prazo</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === "A_VISTA" && (
              <div className="space-y-2">
                <Label htmlFor="conta-corrente">Receber Em</Label>
                <Select
                  value={selectedContaCorrenteId || ""}
                  onValueChange={setSelectedContaCorrenteId}
                >
                  <SelectTrigger id="conta-corrente">
                    <SelectValue placeholder="Selecione a conta de destino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contasCorrentes.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id}>
                        {conta.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {paymentMethod === "A_PRAZO" && (
              <div className="space-y-2">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                  min="1"
                />
              </div>
            )}
            {paymentMethod === "CREDIT_CARD" && (
              <div className="space-y-2">
                <Label htmlFor="fee">Taxa do Cartão (%)</Label>
                <Input
                  id="fee"
                  type="number"
                  value={feePercentage}
                  onChange={(e) => setFeePercentage(Number(e.target.value))}
                  min="0"
                />
              </div>
            )}
          </div>

          {/* Resumo dos Valores */}
          <div className="space-y-2 pt-6 border-t mt-6 text-right">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium">
                {formatCurrency(totalSaleAmount)}
              </span>
            </div>
            {feeAmount > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Taxa do Cartão ({feePercentage}%)</span>
                <span className="font-medium">{formatCurrency(feeAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold pt-2 border-t mt-2">
              <span>Total</span>
              <span>{formatCurrency(finalAmount)}</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Link href="/sales" passHref>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Venda"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
