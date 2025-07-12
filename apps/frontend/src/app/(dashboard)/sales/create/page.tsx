// apps/frontend/src/app/sales/create/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import api from "@/lib/api";
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
import { toast } from "sonner";

import { FormCombobox } from "@/components/ui/FormCombobox"; // Certifique-se que o caminho está correto

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
  unitPrice?: number;
}

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
}

interface ContaCorrente {
  id: string;
  numeroConta: string;
  saldo: number;
  moeda: string;
  deletedAt?: string | null; // Adicionado para responsividade
}

// Definição de taxas de pagamento (Exemplo)
// Em um sistema real, estas taxas seriam configuráveis no backend
const PAYMENT_FEES = {
  "Credit Card": {
    1: 0.03, // 3% para 1x (crédito à vista)
    2: 0.04, // 4% para 2x
    3: 0.045, // 4.5% para 3x
    4: 0.05, // 5% para 4x
    5: 0.055, // 5.5% para 5x
    6: 0.06, // 6% para 6x
    7: 0.065, // 6.5% para 7x
    8: 0.07, // 7% para 8x
    9: 0.075, // 7.5% para 9x
    10: 0.08, // 8% para 10x
    11: 0.085, // 8.5% para 11x
    12: 0.09, // 9% para 12x
    default: 0.095, // 9.5% para mais de 12x ou parcelas não especificadas
  },
  "Debit Card": { default: 0.015 }, // 1.5% para débito
  "Bank Transfer": { default: 0.005 }, // 0.5% para transferência
  Cash: { default: 0 },
  Pix: { default: 0 },
};

export default function CreateSalePage() {
  const { user, loading } = useAuth(); // 'loading' e 'user' do useAuth
  const router = useRouter();

  // Estados dos dados do formulário
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contasContabeisReceita, setContasContabeisReceita] = useState<
    ContaContabil[]
  >([]);
  const [contasCorrentesAtivas, setContasCorrentesAtivas] = useState<
    ContaCorrente[]
  >([]);

  // Estados dos campos selecionados
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedContaContabilId, setSelectedContaContabilId] = useState<
    string | null
  >(null);
  const [selectedContaCorrenteId, setSelectedContaCorrenteId] = useState<
    string | null
  >(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(1);

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true); // Controla o carregamento dos dados específicos da página

  // Variável calculada: Define quais métodos de pagamento SÃO à vista e exigem conta corrente
  const methodsRequiringContaCorrente = ["Cash", "Pix", "Debit Card"];
  const isContaCorrenteRequired =
    methodsRequiringContaCorrente.includes(paymentMethod);

  // useEffect PRINCIPAL para autenticação e carregamento de dados da página
  useEffect(() => {
    // Só prossegue se o carregamento do useAuth terminou
    if (!loading) {
      if (!user) {
        // Se não há usuário, redireciona para o login
        router.push("/login");
      } else {
        // Se o usuário está autenticado, carrega os dados
        const loadPageData = async () => {
          try {
            await Promise.all([
              // Carrega todos os dados em paralelo
              fetchClients(),
              fetchProducts(),
              fetchContasContabeisReceita(),
              fetchContasCorrentesAtivas(),
            ]);
          } catch (error) {
            toast.error("Erro ao carregar dados da página de venda.");
            console.error("Erro ao carregar dados da página:", error); // Log para depuração
          } finally {
            setIsPageLoading(false); // Marca que o carregamento da página terminou
          }
        };
        loadPageData();
      }
    }
  }, [user, loading, router]); // Dependências: user, loading (do useAuth), router (para redirecionar)

  // Funções de busca de dados
  const fetchClients = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;
    try {
      const response = await api.get("/clients", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setClients(response.data);
    } catch (err: any) {
      console.error("Erro ao carregar clientes:", err);
      throw err; // Propaga o erro para o Promise.all
    }
  };

  const fetchProducts = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;
    try {
      const response = await api.get("/products", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProducts(
        response.data.map((p: any) => ({ ...p, price: parseFloat(p.price) }))
      );
    } catch (err: any) {
      console.error("Erro ao carregar produtos:", err);
      throw err;
    }
  };

  const fetchContasContabeisReceita = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;
    try {
      const response = await api.get("/contas-contabeis", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setContasContabeisReceita(
        response.data.filter(
          (conta: ContaContabil) =>
            conta.tipo === "RECEITA" && conta.aceitaLancamento
        )
      );
    } catch (err: any) {
      console.error("Erro ao carregar contas contábeis:", err);
      throw err;
    }
  };

  const fetchContasCorrentesAtivas = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;
    try {
      const response = await api.get("/contas-correntes", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setContasCorrentesAtivas(
        response.data
          .filter((conta: ContaCorrente) => !conta.deletedAt)
          .map((conta: any) => ({
            ...conta,
            saldo: parseFloat(conta.saldo),
          }))
      );
    } catch (err: any) {
      console.error("Erro ao carregar contas correntes:", err);
      throw err;
    }
  };

  // Funções de manipulação de itens de venda
  const handleItemChange = (
    index: number,
    field: keyof SaleItem,
    value: any
  ) => {
    const newSaleItems = [...saleItems];
    if (field === "productId") {
      const selectedProduct = products.find((p) => p.id === value);
      newSaleItems[index] = {
        ...newSaleItems[index],
        productId: value,
        unitPrice: selectedProduct ? selectedProduct.price : 0,
      };
    } else {
      newSaleItems[index] = { ...newSaleItems[index], [field]: value };
    }
    setSaleItems(newSaleItems);
  };

  const handleAddItem = () => {
    setSaleItems([...saleItems, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newSaleItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(newSaleItems);
  };

  // Funções de formatação e cálculo
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const calculateItemSubtotal = (item: SaleItem): number => {
    const price = item.unitPrice || 0;
    const quantity = item.quantity || 0;
    return price * quantity;
  };

  const totalSaleAmount = useMemo(() => {
    return saleItems.reduce(
      (total, item) => total + calculateItemSubtotal(item),
      0
    );
  }, [saleItems]);

  // CÁLCULO DA TAXA E VALOR LÍQUIDO (usando useMemo para otimização)
  const { calculatedFee, netAmount } = useMemo(() => {
    let feePercentage = 0;

    // Lógica para determinar a porcentagem da taxa
    const methodFeeConfig =
      PAYMENT_FEES[paymentMethod as keyof typeof PAYMENT_FEES];
    if (methodFeeConfig) {
      // Garante que a configuração existe para o método de pagamento
      if (paymentMethod === "Credit Card") {
        // Para Cartão de Crédito, tenta pegar a taxa específica por número de parcelas
        // Usa `hasOwnProperty` para verificar se a chave numérica existe no objeto.
        // Se `numberOfInstallments` não estiver em `methodFeeConfig` como chave numérica, usa `default`.
        feePercentage = (methodFeeConfig as any).hasOwnProperty(
          numberOfInstallments
        )
          ? (methodFeeConfig as any)[numberOfInstallments] // Acessa diretamente a chave numérica
          : (methodFeeConfig as { default: number }).default;
      } else {
        // Para outros métodos, usa a taxa padrão (default)
        feePercentage = (methodFeeConfig as { default: number }).default;
      }
    }

    const feeAmount = totalSaleAmount * feePercentage;
    const net = totalSaleAmount - feeAmount;

    // Retorna valores fixados para evitar problemas de ponto flutuante em dinheiro
    return {
      calculatedFee: parseFloat(feeAmount.toFixed(2)),
      netAmount: parseFloat(net.toFixed(2)),
    };
  }, [totalSaleAmount, paymentMethod, numberOfInstallments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Por favor, faça login para criar vendas.");
      return;
    }
    if (isSubmitting) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Token de acesso não encontrado.");
      return;
    }

    const isInstallmentPayment =
      ["Credit Card", "Bank Transfer"].includes(paymentMethod) &&
      numberOfInstallments > 1;

    // --- Validações ---
    if (!selectedClient) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Selecione um método de pagamento.");
      return;
    }
    if (!selectedContaContabilId) {
      toast.error("Selecione a Conta Contábil de Receita.");
      return;
    }

    // VALIDAÇÃO DA CONTA CORRENTE: Usa isContaCorrenteRequired (definida no escopo do componente)
    if (isContaCorrenteRequired && !selectedContaCorrenteId) {
      toast.error(
        "Para pagamentos à vista (Dinheiro, Pix, Débito), a Conta Corrente é obrigatória."
      );
      return;
    }

    if (
      saleItems.length === 0 ||
      saleItems.some(
        (item) => !item.productId || item.quantity <= 0 || !item.unitPrice
      )
    ) {
      toast.error(
        "Adicione pelo menos um item de venda válido com produto, quantidade e preço."
      );
      return;
    }
    if (
      ["Credit Card", "Bank Transfer"].includes(paymentMethod) &&
      numberOfInstallments <= 0
    ) {
      toast.error("Informe um número de parcelas válido.");
      return;
    }
    if (
      !["Credit Card", "Bank Transfer"].includes(paymentMethod) &&
      numberOfInstallments > 1
    ) {
      toast.error(
        "Número de parcelas deve ser 1 para pagamentos à vista (Dinheiro, Pix, Débito)."
      );
      return;
    }
    // --- Fim das Validações ---

    setIsSubmitting(true);

    const payload: any = {
      clientId: selectedClient,
      items: saleItems.map((item) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity.toString()),
        price: item.unitPrice,
      })),
      paymentMethod,
      totalAmount: totalSaleAmount, // Valor bruto da venda
      feeAmount: calculatedFee, // Valor da taxa
      netAmount: netAmount, // Valor líquido
      contaContabilId: selectedContaContabilId,
      numberOfInstallments: isInstallmentPayment ? numberOfInstallments : 1,
    };

    // Adiciona contaCorrenteId APENAS se o método de pagamento exigir (Dinheiro, Pix, Débito)
    if (isContaCorrenteRequired) {
      payload.contaCorrenteId = selectedContaCorrenteId;
    } else {
      delete payload.contaCorrenteId; // Garante que a propriedade não é enviada
    }

    try {
      await api.post("/sales", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success("Venda criada com sucesso!");
      router.push("/sales");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Ocorreu um erro ao criar a venda.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderização condicional para carregamento ou autenticação
  // A condição 'loading || isPageLoading' é a mais robusta
  if (loading || isPageLoading) {
    return (
      <p className="text-center text-lg mt-10">
        Carregando formulário de venda...
      </p>
    );
  }

  if (!user) {
    return (
      <p className="text-center text-lg mt-10 text-red-500">
        Por favor, faça login para criar vendas.
      </p>
    );
  }

  return (
    <Card className="mx-auto my-8 p-6 shadow-lg rounded-lg max-w-3xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Criar Nova Venda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <FormCombobox
                label="Cliente:"
                options={clients.map((client) => ({
                  value: client.id,
                  label: client.name,
                }))}
                value={selectedClient}
                onValueChange={setSelectedClient}
                placeholder="Selecione um cliente"
                emptyMessage="Nenhum cliente encontrado."
                searchPlaceholder="Pesquisar cliente..."
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">Método de Pagamento:</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  // Reseta selectedContaCorrenteId para null apenas se o método NÃO for à vista que exige conta
                  if (!methodsRequiringContaCorrente.includes(value)) {
                    setSelectedContaCorrenteId(null);
                  }
                  // Reseta as parcelas para 1 se não for parcelável
                  if (!["Credit Card", "Bank Transfer"].includes(value)) {
                    setNumberOfInstallments(1);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um método de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    Selecione um método de pagamento
                  </SelectItem>
                  <SelectItem value="Credit Card">Cartão de Crédito</SelectItem>
                  <SelectItem value="Debit Card">Cartão de Débito</SelectItem>
                  <SelectItem value="Cash">Dinheiro</SelectItem>
                  <SelectItem value="Bank Transfer">
                    Transferência Bancária
                  </SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo Número de Parcelas - Renderizado condicionalmente */}
            {(paymentMethod === "Credit Card" ||
              paymentMethod === "Bank Transfer") && (
              <div>
                <Label htmlFor="numberOfInstallments">
                  Número de Parcelas:
                </Label>
                <Input
                  type="number"
                  id="numberOfInstallments"
                  value={numberOfInstallments}
                  onChange={(e) =>
                    setNumberOfInstallments(parseInt(e.target.value) || 1)
                  }
                  min="1"
                  required
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <FormCombobox
                label="Conta Contábil (Receita):"
                options={contasContabeisReceita.map((conta) => ({
                  value: conta.id,
                  label: `${conta.nome} (${conta.codigo})`,
                }))}
                value={selectedContaContabilId}
                onValueChange={setSelectedContaContabilId}
                placeholder="Selecione a Conta Contábil"
                emptyMessage="Nenhuma conta contábil encontrada."
                searchPlaceholder="Pesquisar conta..."
              />
            </div>

            <div>
              <FormCombobox
                label="Conta Corrente:"
                options={contasCorrentesAtivas.map((conta) => ({
                  value: conta.id,
                  label: `${conta.numeroConta} (${conta.moeda} ${conta.saldo.toFixed(2)})`,
                }))}
                value={selectedContaCorrenteId}
                onValueChange={setSelectedContaCorrenteId}
                placeholder="Selecione a Conta Corrente"
                emptyMessage="Nenhuma conta corrente encontrada."
                searchPlaceholder="Pesquisar conta..."
                disabled={!isContaCorrenteRequired}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4 mt-6 text-gray-800 dark:text-gray-100">
            Itens da Venda
          </h2>
          {saleItems.map((item, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-center gap-2 mb-4 p-3 border rounded-md border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            >
              <div className="w-full md:w-2/5">
                <Label htmlFor={`product-${index}`}>Produto:</Label>
                <FormCombobox
                  label=""
                  options={products.map((product) => ({
                    value: product.id,
                    label: product.name,
                  }))}
                  value={item.productId}
                  onValueChange={(value) =>
                    handleItemChange(index, "productId", value)
                  }
                  placeholder="Selecione um produto"
                  emptyMessage="Nenhum produto encontrado."
                  searchPlaceholder="Pesquisar produto..."
                />
              </div>
              <div className="w-full md:w-1/5">
                <Label htmlFor={`unit-price-${index}`}>Preço Un.:</Label>
                <Input
                  type="text"
                  id={`unit-price-${index}`}
                  value={formatCurrency(item.unitPrice || 0)}
                  readOnly
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
              </div>
              <div className="w-full md:w-1/5">
                <Label htmlFor={`quantity-${index}`}>Quantidade:</Label>
                <Input
                  type="number"
                  id={`quantity-${index}`}
                  name="quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  min="1"
                  required
                />
              </div>
              <div className="w-full md:w-1/5 text-right">
                <Label>Subtotal:</Label>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {formatCurrency(calculateItemSubtotal(item))}
                </p>
              </div>
              <div className="w-full md:w-auto mt-4 md:mt-0 flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleRemoveItem(index)}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="mb-6"
          >
            Adicionar Item
          </Button>

          {/* NOVO: Exibir Taxa e Valor Líquido */}
          <div className="flex flex-col items-end mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between w-full max-w-xs mb-2">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                Valor Bruto:
              </h3>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {formatCurrency(totalSaleAmount)}
              </p>
            </div>
            {/* Só mostra a taxa se houver um método com taxa E a taxa for > 0 */}
            {["Credit Card", "Debit Card", "Bank Transfer"].includes(
              paymentMethod
            ) &&
              calculatedFee > 0 && (
                <div className="flex justify-between w-full max-w-xs mb-2">
                  <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
                    Taxa (
                    {((calculatedFee / totalSaleAmount) * 100 || 0).toFixed(2)}
                    %):
                  </h3>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    - {formatCurrency(calculatedFee)}
                  </p>
                </div>
              )}
            <div className="flex justify-between w-full max-w-xs mt-2 border-t pt-2 border-gray-300 dark:border-gray-600">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Valor Líquido:
              </h3>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                {formatCurrency(netAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Link href="/sales">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando Venda..." : "Criar Venda"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
