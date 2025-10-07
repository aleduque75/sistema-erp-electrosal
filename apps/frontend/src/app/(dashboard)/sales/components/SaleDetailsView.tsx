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
  };
  createdAt: string;
  saleItems: SaleItem[];
  accountsRec: AccountRec[];
  totalAmount: number;
  feeAmount: number;
  goldValue: number | null;
  netAmount: number;
}

export function SaleDetailsView({ sale }: { sale: Sale }) {
  if (!sale) return null;

  const receivedPayments = sale.accountsRec.filter(ar => ar.received);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Cliente</h3>
          <p className="text-muted-foreground">{sale.pessoa.name}</p>
        </div>
        <div>
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

      <div className="flex flex-col items-end space-y-2 pt-4 border-t">
        <div className="flex justify-between w-full max-w-xs">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
        <div className="flex justify-between w-full max-w-xs">
          <span className="text-muted-foreground">Taxas</span>
          <span>{formatCurrency(sale.feeAmount)}</span>
        </div>
        <div className="flex justify-between w-full max-w-xs">
          <span className="text-muted-foreground">Valor em Ouro</span>
          <span>{sale.goldValue ? `${sale.goldValue.toFixed(4)} g` : 'N/A'}</span>
        </div>
        <div className="flex justify-between w-full max-w-xs font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(sale.netAmount)}</span>
        </div>
      </div>
    </div>
  );
}
