"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, DollarSign, Scale, Filter, RefreshCw, ArrowUpRight } from "lucide-react";

interface RecoveryOrderReportItem {
  id: string;
  orderNumber: string;
  dataCriacao: string;
  status: string;
  metalType: string;
  clients: string;
  analysesCount: number;
  recoveredGrams: number;
  creditedGrams: number;
  metalMarginGrams: number;
  refPriceBRL: number;
  metalMarginBRL: number;
  quotationGainBRL: number;
  rawMaterialCostBRL: number;
  commissionBRL: number;
  netProfitBRL: number;
}

interface SummaryReport {
  totalOrders: number;
  totalRecoveredGrams: number;
  totalCreditedGrams: number;
  totalMetalMarginGrams: number;
  totalMetalMarginBRL: number;
  totalQuotationGainBRL: number;
  totalRawMaterialCostBRL: number;
  totalCommissionBRL: number;
  totalNetProfitBRL: number;
}

export default function ResultadoRecuperacaoPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary: SummaryReport; orders: RecoveryOrderReportItem[] } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);

      const response = await api.get(`/reports/recovery-profitability?${query.toString()}`);
      setData(response.data);
    } catch (err: any) {
      toast.error("Erro ao carregar relatório de resultado das ordens de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  const formatGrams = (val: number) =>
    new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val || 0) + "g";

  const summary = data?.summary;
  const orders = data?.orders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-500" />
            Resultado & Rastreabilidade de Ordens de Recuperação
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe o rendimento bruto recuperado, créditos a clientes, margem em metal, ganho de cotação e lucro líquido.
          </p>
        </div>
        <Button onClick={fetchReport} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Data Inicial</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data Final</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 w-40" />
          </div>
          <Button onClick={fetchReport} size="sm" className="h-9">
            <Filter className="h-4 w-4 mr-1.5" /> Filtrar Período
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Metal Recuperado vs Creditado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">
              {formatGrams(summary?.totalRecoveredGrams || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Creditado aos clientes: <span className="font-semibold">{formatGrams(summary?.totalCreditedGrams || 0)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Margem Bruta em Metal Retida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-500">
              {formatGrams(summary?.totalMetalMarginGrams || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor estimado: <span className="font-semibold">{formatCurrency(summary?.totalMetalMarginBRL || 0)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Ganho no Acerto de Cotação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-500">
              {formatCurrency(summary?.totalQuotationGainBRL || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Diferencial de cotação negociada na compra
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase flex items-center justify-between">
              Lucro Líquido Total <TrendingUp className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-primary">
              {formatCurrency(summary?.totalNetProfitBRL || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Descontados insumos ({formatCurrency(summary?.totalRawMaterialCostBRL || 0)}) e comissões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Ordem de Recuperação</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-sm text-muted-foreground">Carregando relatório...</p>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma ordem de recuperação encontrada para o período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="px-3 py-3">N° OR</th>
                    <th className="px-3 py-3">Data</th>
                    <th className="px-3 py-3">Cliente(s) / Origem</th>
                    <th className="px-3 py-3">Recuperado (g)</th>
                    <th className="px-3 py-3">Creditado (g)</th>
                    <th className="px-3 py-3">Margem (g)</th>
                    <th className="px-3 py-3">Ganho Cot. (R$)</th>
                    <th className="px-3 py-3">Insumos (R$)</th>
                    <th className="px-3 py-3">Comissão (R$)</th>
                    <th className="px-3 py-3 text-right">Lucro Líquido (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-3 py-3 font-mono font-bold text-primary">
                        #{item.orderNumber}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {new Date(item.dataCriacao).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-3 font-medium max-w-[200px] truncate" title={item.clients}>
                        {item.clients}
                        {item.analysesCount > 0 && (
                          <Badge variant="outline" className="ml-1 text-[9px] py-0">
                            {item.analysesCount} Análises
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold">
                        {formatGrams(item.recoveredGrams)}
                      </td>
                      <td className="px-3 py-3 font-mono text-muted-foreground">
                        {formatGrams(item.creditedGrams)}
                      </td>
                      <td className="px-3 py-3 font-mono font-extrabold text-amber-500">
                        {formatGrams(item.metalMarginGrams)}
                      </td>
                      <td className="px-3 py-3 text-green-600 font-semibold">
                        {formatCurrency(item.quotationGainBRL)}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatCurrency(item.rawMaterialCostBRL)}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatCurrency(item.commissionBRL)}
                      </td>
                      <td className="px-3 py-3 text-right font-extrabold text-sm text-primary">
                        {formatCurrency(item.netProfitBRL)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
