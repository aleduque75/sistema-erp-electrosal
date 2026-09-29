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

  const cardHoverClass = "cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/50 hover:shadow-md bg-card border-border/80 h-full flex flex-col justify-between overflow-hidden";

  return (
    <>
      <Link href="/sales" className="block h-full">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Vendas no Mês (Au) {data.periodMonth ? `(${data.periodMonth})` : ''}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-0">
            <div
              className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight truncate"
              title={formatGold(data.totalSalesAu)}
            >
              {formatGold(data.totalSalesAu)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver o detalhamento</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/sales" className="block h-full">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Vendas no Mês (BRL)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-0">
            <div
              className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight truncate"
              title={formatCurrency(data.totalSalesBRL)}
            >
              {formatCurrency(data.totalSalesBRL)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver o detalhamento</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/accounts-rec" className="block h-full">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              A Receber (Aberto)
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-0">
            <div
              className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-tight truncate"
              title={formatCurrency(data.totalAccountsRec)}
            >
              {formatCurrency(data.totalAccountsRec)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver contas a receber</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/accounts-pay" className="block h-full">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              A Pagar (Aberto)
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-0">
            <div
              className="text-lg sm:text-xl lg:text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight truncate"
              title={formatCurrency(data.totalAccountsPay)}
            >
              {formatCurrency(data.totalAccountsPay)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver contas a pagar</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/products" className="block h-full">
        <Card className={cardHoverClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500 shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono tracking-tight truncate">
              {data.totalProducts}
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Clique para ver catálogo</p>
          </CardContent>
        </Card>
      </Link>
    </>
  );
}
