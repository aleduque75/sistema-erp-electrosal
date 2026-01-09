"use client";

import { useState } from "react"; // NOVO
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectLotsModal } from "./SelectLotsModal"; // NOVO
import api from "@/lib/api"; // NOVO
import { toast } from "sonner"; // NOVO

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const formatGold = (value?: number | null) => {
  if (value == null) return "-";
  return `${value.toFixed(4).replace(".", ",")} g`;
};

interface SaleItem {
  id: string;
  product: {
    id: string; // Adicionado
    name: string;
  };
  quantity: number;
  price: number;
  saleItemLots: {
    inventoryLot: {
      batchNumber: string;
    };
    quantity: number;
  }[];
}

interface AccountRec {
  id: string;
  received: boolean;
  receivedAt: string | null;
  amount: number;
  contaCorrente?: { name: string } | null;
  transacoes: { goldAmount?: number; goldPrice?: number; contaCorrente?: { name: string } }[];
}

interface Sale {
  pessoa: {
    name: string;
    logradouro?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    cep?: string | null;
  };
  createdAt: string;
  status: string; // Adicionado
  saleItems: SaleItem[];
  accountsRec: AccountRec[];
  totalAmount: number;
  feeAmount: number;
  goldValue: number | null;
  netAmount: number;
  adjustment?: {
    netProfitBRL: number;
    netDiscrepancyGrams: number;
    totalCostBRL: number;
    paymentReceivedBRL: number;
  };
}

interface SaleDetailsViewProps {
  sale: Sale;
  onReceivePayment?: (accountRec: AccountRec) => void;
}

export function SaleDetailsView({ sale, onReceivePayment }: SaleDetailsViewProps) {
  const [isSelectLotsModalOpen, setIsSelectLotsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSaleItem, setSelectedSaleItem] = useState<SaleItem | null>(null);

  const openLotSelector = async (item: SaleItem) => {
    try {
      // A interface do produto precisa ser compatível com a SelectLotsModal
      const productWithLots = await api.get(`/products/${item.product.id}`);
      setSelectedProduct(productWithLots.data);
      setSelectedSaleItem(item);
      setIsSelectLotsModalOpen(true);
    } catch (error) {
      toast.error("Falha ao carregar os lotes do produto.");
    }
  };

  const handleLinkLots = async (data: { lots: { inventoryLotId: string; batchNumber: string; quantity: number }[] }) => {
    if (!selectedSaleItem) return;
    try {
      const payload = {
        lots: data.lots.map(lot => ({
          inventoryLotId: lot.inventoryLotId,
          quantity: lot.quantity,
        })),
      };
      await api.post(`/sales/items/${selectedSaleItem.id}/link-lots`, payload);
      toast.success("Lotes vinculados com sucesso!");
      // O ideal seria recarregar os dados da venda para refletir a mudança
      setIsSelectLotsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao vincular os lotes.");
    }
  };

  if (!sale) return null;

  console.log('Sale object in SaleDetailsView:', sale);

  const receivedPayments = sale.accountsRec.filter(ar => ar.received);
  const pendingAccountsRec = sale.accountsRec.find(ar => !ar.received);
  const paymentLocation = receivedPayments[0]?.transacoes?.[0]?.contaCorrente?.name || 'N/A';

  const profitBRL = Number(sale.adjustment?.netProfitBRL || 0);
  const profitGrams = Number(sale.adjustment?.netDiscrepancyGrams || 0);

  return (
    <div className="space-y-4">
      <SelectLotsModal
        open={isSelectLotsModalOpen}
        onOpenChange={setIsSelectLotsModalOpen}
        product={selectedProduct}
        totalQuantityNeeded={selectedSaleItem?.quantity || 0}
        onAddItem={handleLinkLots} // Reutilizando onAddItem para a lógica de vincular
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitBRL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profitBRL)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro em Metal (g)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitGrams >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatGold(profitGrams)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b pb-4 pt-2">
        <div>
          <h3 className="font-semibold">Cliente</h3>
          <p className="text-muted-foreground">{sale.pessoa.name}</p>
          <p className="text-muted-foreground">
            {`${sale.pessoa.logradouro || ''}, ${sale.pessoa.numero || ''}`}
          </p>
          <p className="text-muted-foreground">
            {`${sale.pessoa.bairro || ''} - ${sale.pessoa.cidade || ''}/${sale.pessoa.uf || ''}`}
          </p>
          <p className="text-muted-foreground">{`CEP: ${sale.pessoa.cep || ''}`}</p>
        </div>
        <div className="text-right">
          <h3 className="font-semibold">Data da Venda</h3>
          <p className="text-muted-foreground">{formatDate(sale.createdAt)}</p>
          <h3 className="font-semibold mt-2">Local de Pagamento</h3>
          <p className="text-muted-foreground">{paymentLocation}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className="text-center">Qtd.</TableHead>
                <TableHead className="text-right">Valor Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.saleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>
                    {item.saleItemLots.length > 0
                      ? item.saleItemLots.map(sil => `Lote: ${sil.inventoryLot.batchNumber} (Qtd: ${sil.quantity})`).join(', ')
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => openLotSelector(item)}>Vincular Lotes</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {receivedPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recebimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Recebimento</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Valor Recebido</TableHead>
                  <TableHead className="text-right">Cotação</TableHead>
                  <TableHead className="text-right">Valor em Ouro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivedPayments.map((ar) => (
                  <TableRow key={ar.id}>
                    <TableCell>{formatDate(ar.receivedAt)}</TableCell>
                    <TableCell>{ar.transacoes[0]?.contaCorrente?.name || (ar.transacoes[0]?.goldAmount ? 'Crédito de Metal' : 'N/A')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ar.amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ar.transacoes[0]?.goldPrice || 0)}</TableCell>
                    <TableCell className="text-right">{formatGold(Number(ar.transacoes[0]?.goldAmount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Botão de Receber Pagamento Condicional */}
      {sale.status === 'SEPARADO' && onReceivePayment && pendingAccountsRec && (
        <div className="pt-4 flex justify-end">
            <Button onClick={() => onReceivePayment(pendingAccountsRec)}>
                Receber Pagamento
            </Button>
        </div>
      )}
    </div>
  );
}
