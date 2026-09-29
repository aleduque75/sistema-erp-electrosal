import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

type Sale = {
  id: string | number;
  orderNumber?: number;
  pessoa?: {
    name?: string;
    email?: string;
  };
  netAmount?: number;
  totalAmount?: number;
  createdAt?: string;
  status?: string;
};

interface RecentSalesProps {
  data: Sale[];
}

export function RecentSales({ data }: RecentSalesProps) {
  const salesList = Array.isArray(data) ? data : [];

  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6 pb-3 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-base sm:text-lg font-bold">Vendas Recentes</CardTitle>
          <CardDescription className="text-xs">As últimas 5 vendas realizadas.</CardDescription>
        </div>
        <Link
          href="/sales"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {salesList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs italic">
            Nenhuma venda recente encontrada.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-semibold pl-4 sm:pl-6">Pedido / Cliente</TableHead>
                <TableHead className="text-xs font-semibold text-right pr-4 sm:pr-6">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesList.map((sale) => {
                const total = sale.netAmount ?? sale.totalAmount ?? 0;
                const formattedDate = sale.createdAt
                  ? new Date(sale.createdAt).toLocaleDateString("pt-BR")
                  : "";

                return (
                  <TableRow key={sale.id} className="border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="pl-4 sm:pl-6 py-2.5">
                      <div className="flex items-center gap-2">
                        {sale.orderNumber && (
                          <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            #{sale.orderNumber}
                          </span>
                        )}
                        <span className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                          {sale.pessoa?.name || "Cliente não identificado"}
                        </span>
                      </div>
                      {formattedDate && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {formattedDate}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4 sm:pr-6 py-2.5">
                      <span className="font-bold text-xs sm:text-sm text-emerald-500 font-mono">
                        {formatCurrency(total)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
