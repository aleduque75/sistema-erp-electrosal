import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  DollarSign,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
} from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const formatGold = (value: number) => `${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}g`;

interface KpiData {
  totalSalesBRL: number;
  totalSalesAu: number;
  totalAccountsRec: number;
  totalAccountsPay: number;
  totalProducts: number;
  periodMonth?: string;
}

export function KpiCards({ data }: { data: KpiData }) {
  if (!data) return null;

  const cardHoverClass = "cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/50 hover:shadow-md bg-card";

  return (
    <>
      <Link href="/sales" className="block">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Vendas no Mês (Au) {data.periodMonth ? `(${data.periodMonth})` : ''}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatGold(data.totalSalesAu)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver o detalhamento</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/sales" className="block">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Vendas no Mês (BRL)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.totalSalesBRL)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver o detalhamento</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/accounts-rec" className="block">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              A Receber (Aberto)
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(data.totalAccountsRec)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver contas a receber</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/accounts-pay" className="block">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              A Pagar (Aberto)
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(data.totalAccountsPay)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver contas a pagar</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/products" className="block">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.totalProducts}</div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver catálogo</p>
          </CardContent>
        </Card>
      </Link>
    </>
  );
}
