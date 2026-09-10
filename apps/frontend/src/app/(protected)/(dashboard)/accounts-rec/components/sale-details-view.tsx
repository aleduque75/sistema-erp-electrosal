"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/lib/api";
import { toast } from "sonner";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const formatGold = (value?: number | null) => {
  if (value == null) return "-";
  return `${value.toFixed(4).replace(".", ",")} g`;
};

interface SaleItem {
  id: string;
  product: {
    id: string;
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

interface TransacaoItem {
  id: string;
  valor: number;
  dataHora?: string;
  goldAmount?: number;
  goldPrice?: number;
  accountRecId?: string;
  contaCorrente?: { name?: string; nome?: string } | null;
}

interface AccountRec {
  id: string;
  received: boolean;
  receivedAt: string | null;
  amount: number;
  contaCorrente?: { name: string } | null;
  transacoes: TransacaoItem[];
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
  status: string;
  saleItems: SaleItem[];
  accountsRec: AccountRec[];
  totalAmount: number;
  feeAmount: number;
  goldValue: number | null;
  netAmount: number;
  observation?: string | null;
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
  onUpdate?: () => void;
}

export function SaleDetailsView({ sale, onReceivePayment, onUpdate }: SaleDetailsViewProps) {
  const [transactionToRevert, setTransactionToRevert] = useState<(TransacaoItem & { accountRecId: string }) | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  if (!sale) return null;

  const allReceivedTransactions = (sale.accountsRec || [])
    .filter((ar) => ar.received || (ar.transacoes && ar.transacoes.length > 0))
    .flatMap((ar) =>
      (ar.transacoes || []).map((t) => ({
        ...t,
        accountRecId: t.accountRecId || ar.id,
        receivedAt: ar.receivedAt,
      }))
    );

  const pendingAccountsRec = (sale.accountsRec || []).find((ar) => !ar.received);

  const profitBRL = Number(sale.adjustment?.netProfitBRL || 0);
  const profitGrams = Number(sale.adjustment?.netDiscrepancyGrams || 0);

  const handleForceFinalize = async (accountRecId: string) => {
    try {
      await api.patch(`/accounts-rec/${accountRecId}/force-finalize`);
      toast.success("Duplicata finalizada manualmente com sucesso!");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erro ao finalizar duplicata.");
    }
  };

  const handleRevertPayment = async () => {
    if (!transactionToRevert) return;
    setIsReverting(true);
    try {
      await api.delete(
        `/accounts-rec/${transactionToRevert.accountRecId}/payments/${transactionToRevert.id}`
      );
      toast.success("Recebimento estornado com sucesso!");
      setTransactionToRevert(null);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao estornar recebimento.");
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitBRL >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(profitBRL)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro em Metal (g)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitGrams >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatGold(profitGrams)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b pb-4">
        <div>
          <h3 className="font-semibold">Cliente</h3>
          <p className="text-muted-foreground">{sale.pessoa.name}</p>
          <p className="text-muted-foreground">
            {`${sale.pessoa.logradouro || ""}, ${sale.pessoa.numero || ""}`}
          </p>
          <p className="text-muted-foreground">
            {`${sale.pessoa.bairro || ""} - ${sale.pessoa.cidade || ""}/${sale.pessoa.uf || ""}`}
          </p>
          <p className="text-muted-foreground">{`CEP: ${sale.pessoa.cep || ""}`}</p>
        </div>
        <div className="text-right">
          <h3 className="font-semibold">Data da Venda</h3>
          <p className="text-muted-foreground">{formatDate(sale.createdAt)}</p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.saleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>
                    {item.saleItemLots.length > 0
                      ? item.saleItemLots
                          .map((sil) => `Lote: ${sil.inventoryLot.batchNumber} (Qtd: ${sil.quantity})`)
                          .join(", ")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {sale.observation && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{sale.observation}</p>
          </CardContent>
        </Card>
      )}

      {allReceivedTransactions.length > 0 && (
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
                  <TableHead className="text-center w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allReceivedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.dataHora)}</TableCell>
                    <TableCell>
                      {transaction.contaCorrente?.nome ||
                        transaction.contaCorrente?.name ||
                        (transaction.goldAmount ? "Crédito de Metal" : "N/A")}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(transaction.valor))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(transaction.goldPrice) || 0)}</TableCell>
                    <TableCell className="text-right">{formatGold(Number(transaction.goldAmount))}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Estornar recebimento"
                        onClick={() => setTransactionToRevert(transaction)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      {pendingAccountsRec && (
        <div className="pt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => handleForceFinalize(pendingAccountsRec.id)}>
            Finalizar Duplicata Manualmente
          </Button>
          {sale.status === "SEPARADO" && onReceivePayment && (
            <Button onClick={() => onReceivePayment(pendingAccountsRec)}>
              Receber Pagamento
            </Button>
          )}
        </div>
      )}

      {/* Diálogo de confirmação para estorno de recebimento individual */}
      <AlertDialog open={!!transactionToRevert} onOpenChange={(open) => !open && setTransactionToRevert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar Recebimento</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Tem certeza que deseja estornar o recebimento no valor de{" "}
                <strong className="text-foreground">
                  {formatCurrency(Number(transactionToRevert?.valor))}
                </strong>
                {transactionToRevert?.contaCorrente?.nome || transactionToRevert?.contaCorrente?.name
                  ? ` na conta ${transactionToRevert?.contaCorrente?.nome || transactionToRevert?.contaCorrente?.name}`
                  : ""}
                ?
              </span>
              <span className="block text-muted-foreground text-xs">
                A movimentação financeira correspondente será excluída e o saldo pendente da duplicata será recalculado automaticamente.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReverting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevertPayment}
              disabled={isReverting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isReverting ? "Estornando..." : "Confirmar Estorno"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}