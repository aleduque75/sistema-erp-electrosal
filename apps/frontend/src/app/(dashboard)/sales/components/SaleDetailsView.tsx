"use client";

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

interface SaleItem {
  id: string;
  product: {
    name: string;
  };
  inventoryLotId?: string;
  quantity: number;
  price: number;
}

interface AccountRec {
  id: string;
  received: boolean;
  receivedAt: string | null;
  amount: number;
  contaCorrente?: { name: string } | null;
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
}

interface SaleDetailsViewProps {
  sale: Sale;
  onReceivePayment?: (accountRec: AccountRec) => void;
}

export function SaleDetailsView({ sale, onReceivePayment }: SaleDetailsViewProps) {
  if (!sale) return null;

  const receivedPayments = sale.accountsRec.filter(ar => ar.received);
  const pendingAccountsRec = sale.accountsRec.find(ar => !ar.received);
  const paymentLocation = receivedPayments[0]?.contaCorrente?.name || 'N/A';

  return (
    <div className="space-y-4">
      {/* ... (conteúdo existente do componente) ... */}
      <div className="grid grid-cols-2 gap-4 border-b pb-4">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.saleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.inventoryLotId ? item.inventoryLotId.substring(0, 8) : 'N/A'}</TableCell>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivedPayments.map((ar) => (
                  <TableRow key={ar.id}>
                    <TableCell>{formatDate(ar.receivedAt)}</TableCell>
                    <TableCell>{ar.contaCorrente?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ar.amount)}</TableCell>
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
