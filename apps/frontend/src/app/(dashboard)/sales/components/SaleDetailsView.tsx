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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export function SaleDetailsView({ sale }) {
  if (!sale) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Cliente</h3>
          <p className="text-muted-foreground">{sale.client.name}</p>
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
                <TableHead className="text-center">Qtd.</TableHead>
                <TableHead className="text-right">Valor Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.saleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
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

      <div className="flex flex-col items-end space-y-2 pt-4 border-t">
        <div className="flex justify-between w-full max-w-xs">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
        <div className="flex justify-between w-full max-w-xs">
          <span className="text-muted-foreground">Taxas</span>
          <span>{formatCurrency(sale.feeAmount)}</span>
        </div>
        <div className="flex justify-between w-full max-w-xs font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(sale.netAmount)}</span>
        </div>
      </div>
    </div>
  );
}
