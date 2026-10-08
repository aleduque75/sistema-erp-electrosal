"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface ChargedOrder {
  saleId: string;
  orderNumber: number;
  data: string;
  clientName: string;
  totalAmount: number;
  shippingCost: number;
  status: string;
}

interface PaidExpense {
  transacaoId: string;
  dataHora: string;
  descricao: string;
  valor: number;
  contaCorrente: string;
  contaContabil: string;
  codigoContabil: string;
}

interface ShippingReconciliationData {
  summary: {
    totalCharged: number;
    totalPaid: number;
    balance: number;
    status: "LUCRO" | "PREJUIZO" | "EQUILIBRADO";
    marginPercentage: number;
    ordersWithShippingCount: number;
    shippingExpensesCount: number;
    averageShippingCharged: number;
  };
  chargedOrders: ChargedOrder[];
  paidExpenses: PaidExpense[];
}

const formatCurrency = (val?: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
};

export default function ShippingReconciliationPage() {
  const [data, setData] = useState<ShippingReconciliationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split("T")[0];
  });
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("comparativo");

  // Carregar dados da API
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (search.trim()) params.set("search", search.trim());

      const res = await api.get(`/reports/shipping-reconciliation?${params.toString()}`);
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao carregar confronto de fretes.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchReport]);

  // Presets de Data
  const setPeriodPreset = (preset: "mes_atual" | "mes_anterior" | "ultimos_3_meses" | "tudo") => {
    const now = new Date();
    if (preset === "mes_atual") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    } else if (preset === "mes_anterior") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    } else if (preset === "ultimos_3_meses") {
      const first = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const isProfit = (data?.summary.balance || 0) >= 0;

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Truck className="h-7 w-7 text-primary" />
              Confronto de Fretes (Cobrado vs Pago)
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Conciliação de Envios
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cruza o valor de frete cobrado nos pedidos de venda contra o custo real pago aos Correios, Melhor Envio e transportadoras.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Frete Cobrado */}
        <Card className="border border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Frete Cobrado (Pedidos)
              <Package className="h-4 w-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-500">
              {formatCurrency(data?.summary.totalCharged)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>{data?.summary.ordersWithShippingCount || 0} pedidos com frete</span>
            <span className="font-mono text-emerald-500 font-semibold">
              Média: {formatCurrency(data?.summary.averageShippingCharged)}
            </span>
          </CardContent>
        </Card>

        {/* Frete Pago */}
        <Card className="border border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Frete Pago (Correios / Envios)
              <Truck className="h-4 w-4 text-rose-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-500">
              {formatCurrency(data?.summary.totalPaid)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data?.summary.shippingExpensesCount || 0} pagamentos registrados no extrato
          </CardContent>
        </Card>

        {/* Resultado do Frete */}
        <Card
          className={`border shadow-sm backdrop-blur-sm ${
            isProfit
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-rose-500/30 bg-rose-500/5"
          }`}
        >
          <CardHeader className="pb-2">
            <CardDescription
              className={`text-xs font-semibold uppercase tracking-wider flex items-center justify-between ${
                isProfit ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              Resultado Líquido do Frete
              {isProfit ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
            </CardDescription>
            <CardTitle
              className={`text-2xl font-bold ${
                isProfit ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(data?.summary.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`text-xs font-medium flex items-center gap-1.5 ${
              isProfit ? "text-emerald-500" : "text-rose-400"
            }`}
          >
            {isProfit ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Superávit / Margem de {(data?.summary.marginPercentage || 0).toFixed(1)}%
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                Custo de envio absorvido pela empresa
              </>
            )}
          </CardContent>
        </Card>

        {/* Status Operacional */}
        <Card className="border border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Eficiência de Cobertura
              <DollarSign className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {data?.summary.totalPaid && data.summary.totalPaid > 0
                ? `${Math.round(((data.summary.totalCharged || 0) / data.summary.totalPaid) * 100)}%`
                : "100%"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Taxa de cobertura do frete cobrado sobre o custo
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Períodos */}
      <Card className="border border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Presets Rápidos */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Período:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodPreset("mes_atual")}
                className="text-xs h-7 px-2.5"
              >
                Mês Atual
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodPreset("mes_anterior")}
                className="text-xs h-7 px-2.5"
              >
                Mês Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodPreset("ultimos_3_meses")}
                className="text-xs h-7 px-2.5"
              >
                Últimos 3 Meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodPreset("tudo")}
                className="text-xs h-7 px-2.5"
              >
                Todo o Histórico
              </Button>
            </div>

            {/* Busca */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filtrar por pedido, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 border-t border-border/60">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Data Inicial:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Data Final:</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Visualização */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="comparativo" className="text-xs flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Visão Comparativa (Lado a Lado)
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="text-xs flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Pedidos com Frete ({data?.chargedOrders.length || 0})
          </TabsTrigger>
          <TabsTrigger value="despesas" className="text-xs flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Pagamentos de Frete ({data?.paidExpenses.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* 1. Visão Comparativa Lado a Lado */}
        <TabsContent value="comparativo" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Coluna Esquerda: Frete Cobrado */}
            <Card className="border border-border/60 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-sm font-bold text-foreground">
                      Frete Cobrado nos Pedidos
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                    Total: {formatCurrency(data?.summary.totalCharged)}
                  </Badge>
                </div>
              </CardHeader>
              <div className="overflow-x-auto flex-1 max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] sticky top-0 border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Pedido / Cliente</th>
                      <th className="px-3 py-2 text-right">Total Pedido</th>
                      <th className="px-3 py-2 text-right">Frete Cobrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          Carregando pedidos...
                        </td>
                      </tr>
                    ) : !data?.chargedOrders || data.chargedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          Nenhum pedido com frete cobrado no período.
                        </td>
                      </tr>
                    ) : (
                      data.chargedOrders.map((order) => (
                        <tr key={order.saleId} className="hover:bg-muted/30">
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground font-mono">
                            {formatDate(order.data)}
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              href={`/sales/${order.saleId}`}
                              className="font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              #{order.orderNumber}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                            <span className="text-[11px] text-muted-foreground truncate block max-w-[180px]">
                              {order.clientName}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-500">
                            +{formatCurrency(order.shippingCost)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Coluna Direita: Frete Pago aos Correios / Melhor Envio */}
            <Card className="border border-border/60 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-rose-500" />
                    <CardTitle className="text-sm font-bold text-foreground">
                      Frete Pago (Correios / Melhor Envio)
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-rose-500 border-rose-500/30">
                    Total: {formatCurrency(data?.summary.totalPaid)}
                  </Badge>
                </div>
              </CardHeader>
              <div className="overflow-x-auto flex-1 max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] sticky top-0 border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Descrição / Conta</th>
                      <th className="px-3 py-2">Categoria</th>
                      <th className="px-3 py-2 text-right">Valor Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          Carregando pagamentos...
                        </td>
                      </tr>
                    ) : !data?.paidExpenses || data.paidExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          Nenhum pagamento de frete registrado no período.
                        </td>
                      </tr>
                    ) : (
                      data.paidExpenses.map((exp) => (
                        <tr key={exp.transacaoId} className="hover:bg-muted/30">
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground font-mono">
                            {formatDate(exp.dataHora)}
                          </td>
                          <td className="px-3 py-2 max-w-[200px]">
                            <div className="font-medium text-foreground truncate">{exp.descricao}</div>
                            <div className="text-[10px] text-muted-foreground">{exp.contaCorrente}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-[11px] font-mono text-muted-foreground block">
                              {exp.codigoContabil}
                            </span>
                            <span className="text-[10px] text-foreground truncate block max-w-[120px]">
                              {exp.contaContabil}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-rose-500 whitespace-nowrap">
                            -{formatCurrency(exp.valor)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Aba Apenas Pedidos */}
        <TabsContent value="pedidos">
          <Card className="border border-border/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Pedido #</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total da Venda</th>
                    <th className="px-4 py-3 text-right">Frete Cobrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data?.chargedOrders.map((order) => (
                    <tr key={order.saleId} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{formatDate(order.data)}</td>
                      <td className="px-4 py-3 font-bold text-primary">
                        <Link href={`/sales/${order.saleId}`} className="hover:underline flex items-center gap-1">
                          #{order.orderNumber}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{order.clientName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-500">
                        +{formatCurrency(order.shippingCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 3. Aba Apenas Despesas de Envio */}
        <TabsContent value="despesas">
          <Card className="border border-border/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Descrição da Despesa</th>
                    <th className="px-4 py-3">Conta Bancária</th>
                    <th className="px-4 py-3">Conta Contábil</th>
                    <th className="px-4 py-3 text-right">Valor Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data?.paidExpenses.map((exp) => (
                    <tr key={exp.transacaoId} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{formatDate(exp.dataHora)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{exp.descricao}</td>
                      <td className="px-4 py-3 text-muted-foreground">{exp.contaCorrente}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-muted-foreground text-[10px] mr-1">
                          {exp.codigoContabil}
                        </span>
                        <span>{exp.contaContabil}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-500">
                        -{formatCurrency(exp.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
