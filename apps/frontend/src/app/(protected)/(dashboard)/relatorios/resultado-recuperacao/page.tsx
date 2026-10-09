"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  TrendingUp,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  User,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
} from "lucide-react";

interface TreeNode {
  id: string;
  numeroAnalise: string;
  clienteName: string;
  descricaoMaterial: string;
  creditedGrams: number;
  settledGrams: number;
  remainingGrams: number;
  settledRateBRL: number;
  refPriceBRL: number;
  settledValueBRL: number;
  gainBRL: number;
  status: string;
}

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
  treeNodes?: TreeNode[];
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

interface MaterialBalanceItem {
  materialName: string;
  saldoAnteriorGrams: number;
  entradasMesGrams: number;
  saidasMesGrams: number;
  saldoProximoMesGrams: number;
  analisesCount: number;
  items: Array<{
    id: string;
    numeroAnalise: string;
    clienteName: string;
    dataEntrada: string;
    grams: number;
    status: string;
    ordemDeRecuperacaoId?: string | null;
    orderNumber?: string | null;
    recoveryDate?: string | null;
    category: 'saldo_anterior' | 'entrada_mes' | 'saida_mes' | 'processado_anterior';
  }>;
}

interface MaterialsReportSummary {
  periodStart: string;
  periodEnd: string;
  totalMaterials: number;
  totalSaldoAnteriorGrams: number;
  totalEntradasMesGrams: number;
  totalSaidasMesGrams: number;
  totalSaldoProximoMesGrams: number;
}

export default function ResultadoRecuperacaoPage() {
  const [activeTab, setActiveTab] = useState<"lucratividade" | "materiais">("lucratividade");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary: SummaryReport; orders: RecoveryOrderReportItem[] } | null>(null);
  const [materialsData, setMaterialsData] = useState<{ summary: MaterialsReportSummary; materials: MaterialBalanceItem[] } | null>(null);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedMaterials, setExpandedMaterials] = useState<Record<string, boolean>>({});

  const toggleExpandOrder = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandMaterial = (name: string) => {
    setExpandedMaterials((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const fetchProfitabilityReport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);

      const response = await api.get(`/reports/recovery-profitability?${query.toString()}`);
      setData(response.data);
    } catch (err: any) {
      toast.error("Erro ao carregar relatório de lucratividade.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialsReport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);

      const response = await api.get(`/reports/recovery-materials?${query.toString()}`);
      setMaterialsData(response.data);
    } catch (err: any) {
      toast.error("Erro ao carregar relatório de saldo por material.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "lucratividade") {
      fetchProfitabilityReport();
    } else {
      fetchMaterialsReport();
    }
  }, [activeTab]);

  const handleFilter = () => {
    if (activeTab === "lucratividade") {
      fetchProfitabilityReport();
    } else {
      fetchMaterialsReport();
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  const formatGrams = (val: number) =>
    new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0) + "g";

  const summary = data?.summary;
  const orders = data?.orders || [];

  const matSummary = materialsData?.summary;
  const materials = materialsData?.materials || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-500" />
            Relatórios de Recuperação de Metais
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe o rendimento, rastreabilidade de ordens e o saldo mensal acumulado por tipo de material.
          </p>
        </div>
        <Button onClick={handleFilter} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* Tabs Selection */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("lucratividade")}
          className={`py-2.5 px-5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "lucratividade"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Resultado & Árvore por Ordem de Recuperação
        </button>
        <button
          onClick={() => setActiveTab("materiais")}
          className={`py-2.5 px-5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "materiais"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          Saldo Mensal por Material (Anterior / Atual / Próximo Mês)
        </button>
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
          <Button onClick={handleFilter} size="sm" className="h-9">
            <Filter className="h-4 w-4 mr-1.5" /> Filtrar Período
          </Button>
        </div>
      </Card>

      {/* TAB 1: LUCRATIVIDADE E ÁRVORE DE LANÇAMENTOS */}
      {activeTab === "lucratividade" && (
        <div className="space-y-6">
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
              <CardTitle className="text-lg">Árvore de Lançamentos por Ordem de Recuperação</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Carregando relatório...</p>
              ) : orders.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma ordem de recuperação encontrada para o período.</p>
              ) : (
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                      <tr>
                        <th className="w-8 px-2 py-3"></th>
                        <th className="px-3 py-3">N° OR</th>
                        <th className="px-3 py-3">Data</th>
                        <th className="px-3 py-3">Cliente(s) / Origem</th>
                        <th className="px-3 py-3">Recuperado (g)</th>
                        <th className="px-3 py-3">Creditado (g)</th>
                        <th className="px-3 py-3">Margem (g)</th>
                        <th className="px-3 py-3">Ganho Cot. (R$)</th>
                        <th className="px-3 py-3">Insumos (R$)</th>
                        <th className="px-3 py-3 text-right">Lucro Líquido (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((item) => {
                        const isExpanded = !!expandedOrders[item.id];
                        const hasNodes = item.treeNodes && item.treeNodes.length > 0;

                        return (
                          <tbody key={item.id} className="divide-y">
                            <tr
                              className="hover:bg-muted/10 transition-colors cursor-pointer"
                              onClick={() => toggleExpandOrder(item.id)}
                            >
                              <td className="px-2 py-3 text-center">
                                {hasNodes ? (
                                  isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-primary inline" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                                  )
                                ) : null}
                              </td>
                              <td className="px-3 py-3 font-mono font-bold text-primary text-sm">
                                #{item.orderNumber}
                              </td>
                              <td className="px-3 py-3 text-muted-foreground">
                                {new Date(item.dataCriacao).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="px-3 py-3 font-medium max-w-[200px] truncate" title={item.clients}>
                                {item.clients}
                                {item.analysesCount > 0 && (
                                  <Badge variant="outline" className="ml-1.5 text-[9px] py-0">
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
                              <td className="px-3 py-3 text-right font-extrabold text-sm text-primary">
                                {formatCurrency(item.netProfitBRL)}
                              </td>
                            </tr>

                            {/* Expanded Tree Sub-rows */}
                            {isExpanded && item.treeNodes && item.treeNodes.length > 0 && (
                              <tr className="bg-accent/20 border-b">
                                <td colSpan={10} className="p-3 pl-10">
                                  <div className="space-y-2">
                                    <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                      <FlaskConical className="h-3.5 w-3.5 text-primary" /> Lançamentos Vinculados a esta OR (#{item.orderNumber}):
                                    </h5>
                                    <div className="border rounded-lg bg-background overflow-hidden">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/40 text-[10px] text-muted-foreground border-b">
                                          <tr>
                                            <th className="px-3 py-2">Análise #</th>
                                            <th className="px-3 py-2">Cliente</th>
                                            <th className="px-3 py-2">Descrição do Material</th>
                                            <th className="px-3 py-2">Crédito Gerado (g)</th>
                                            <th className="px-3 py-2">Cotação Acerto</th>
                                            <th className="px-3 py-2">Valor Quitado (R$)</th>
                                            <th className="px-3 py-2 text-right">Ganho Cotação</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                          {item.treeNodes.map((node) => (
                                            <tr key={node.id} className="hover:bg-muted/10">
                                              <td className="px-3 py-2 font-mono font-medium text-primary">
                                                #{node.numeroAnalise}
                                              </td>
                                              <td className="px-3 py-2 font-medium flex items-center gap-1">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                {node.clienteName}
                                              </td>
                                              <td className="px-3 py-2 text-muted-foreground max-w-[250px] truncate" title={node.descricaoMaterial}>
                                                {node.descricaoMaterial}
                                              </td>
                                              <td className="px-3 py-2 font-mono font-semibold">
                                                {formatGrams(node.creditedGrams)}
                                              </td>
                                              <td className="px-3 py-2 font-mono">
                                                {formatCurrency(node.settledRateBRL)} /g
                                              </td>
                                              <td className="px-3 py-2 font-mono">
                                                {formatCurrency(node.settledValueBRL)}
                                              </td>
                                              <td className="px-3 py-2 text-right font-semibold text-green-600">
                                                {formatCurrency(node.gainBRL)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SALDO MENSAL POR MATERIAL */}
      {activeTab === "materiais" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Boxes className="h-4 w-4 text-blue-500" /> Saldo Anterior às Recuperações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">
                  {formatGrams(matSummary?.totalSaldoAnteriorGrams || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gramas pendentes acumuladas de meses anteriores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <ArrowDownLeft className="h-4 w-4 text-green-500" /> Entradas Recebidas no Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  {formatGrams(matSummary?.totalEntradasMesGrams || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Novas análises químicas registradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-amber-500" /> Saídas para Recuperação no Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-amber-600">
                  {formatGrams(matSummary?.totalSaidasMesGrams || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enviadas para Ordens de Recuperação no mês
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-primary uppercase flex items-center justify-between">
                  Saldo para o Próximo Mês
                  <Package className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-primary">
                  {formatGrams(matSummary?.totalSaldoProximoMesGrams || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  (Saldo Anterior + Entradas - Saídas)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Materials Balance Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Balanço de Saldo por Tipo de Material</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Extrato detalhado por material. Clique em cada linha para expandir as análises vinculadas.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {matSummary?.totalMaterials || 0} Materiais Distintos
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Carregando balanço de materiais...</p>
              ) : materials.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Nenhum material encontrado no sistema para o período.</p>
              ) : (
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                      <tr>
                        <th className="w-8 px-2 py-3"></th>
                        <th className="px-3 py-3">Descrição do Material</th>
                        <th className="px-3 py-3 text-center">N° Análises</th>
                        <th className="px-3 py-3">Saldo Anterior (g)</th>
                        <th className="px-3 py-3 text-green-600">Entradas Mês (g)</th>
                        <th className="px-3 py-3 text-amber-600">Saídas p/ OR (g)</th>
                        <th className="px-3 py-3 text-right font-bold text-primary">Saldo Próximo Mês (g)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {materials.map((mat) => {
                        const isExpanded = !!expandedMaterials[mat.materialName];
                        const hasItems = mat.items && mat.items.length > 0;

                        return (
                          <tbody key={mat.materialName} className="divide-y">
                            <tr
                              className="hover:bg-muted/10 transition-colors cursor-pointer"
                              onClick={() => toggleExpandMaterial(mat.materialName)}
                            >
                              <td className="px-2 py-3 text-center">
                                {hasItems ? (
                                  isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-primary inline" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                                  )
                                ) : null}
                              </td>
                              <td className="px-3 py-3 font-semibold text-foreground text-sm flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                {mat.materialName}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <Badge variant="secondary" className="font-mono text-[10px]">
                                  {mat.analisesCount}
                                </Badge>
                              </td>
                              <td className="px-3 py-3 font-mono font-medium text-blue-600">
                                {formatGrams(mat.saldoAnteriorGrams)}
                              </td>
                              <td className="px-3 py-3 font-mono font-medium text-green-600">
                                +{formatGrams(mat.entradasMesGrams)}
                              </td>
                              <td className="px-3 py-3 font-mono font-medium text-amber-600">
                                -{formatGrams(mat.saidasMesGrams)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono font-extrabold text-sm text-primary">
                                {formatGrams(mat.saldoProximoMesGrams)}
                              </td>
                            </tr>

                            {/* Expanded Material Breakdown Sub-rows */}
                            {isExpanded && hasItems && (
                              <tr className="bg-accent/20 border-b">
                                <td colSpan={7} className="p-3 pl-10">
                                  <div className="space-y-2">
                                    <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                      <FlaskConical className="h-3.5 w-3.5 text-primary" /> Análises Químicas do Material ({mat.materialName}):
                                    </h5>
                                    <div className="border rounded-lg bg-background overflow-hidden">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/40 text-[10px] text-muted-foreground border-b">
                                          <tr>
                                            <th className="px-3 py-2">N° Análise</th>
                                            <th className="px-3 py-2">Data Entrada</th>
                                            <th className="px-3 py-2">Cliente</th>
                                            <th className="px-3 py-2">Gramas (g)</th>
                                            <th className="px-3 py-2">Categoria no Período</th>
                                            <th className="px-3 py-2">Status OR</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                          {mat.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/10">
                                              <td className="px-3 py-2 font-mono font-bold text-primary">
                                                #{item.numeroAnalise}
                                              </td>
                                              <td className="px-3 py-2 text-muted-foreground">
                                                {item.dataEntrada ? new Date(item.dataEntrada).toLocaleDateString("pt-BR") : "-"}
                                              </td>
                                              <td className="px-3 py-2 font-medium">
                                                {item.clienteName}
                                              </td>
                                              <td className="px-3 py-2 font-mono font-semibold">
                                                {formatGrams(item.grams)}
                                              </td>
                                              <td className="px-3 py-2">
                                                {item.category === "saldo_anterior" && (
                                                  <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-[10px]">
                                                    Saldo Anterior
                                                  </Badge>
                                                )}
                                                {item.category === "entrada_mes" && (
                                                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 text-[10px]">
                                                    Entrada do Mês
                                                  </Badge>
                                                )}
                                                {item.category === "saida_mes" && (
                                                  <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-[10px]">
                                                    Saída p/ Recuperação
                                                  </Badge>
                                                )}
                                                {item.category === "processado_anterior" && (
                                                  <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                                    Processado Anteriormente
                                                  </Badge>
                                                )}
                                              </td>
                                              <td className="px-3 py-2">
                                                {item.orderNumber ? (
                                                  <span className="font-mono font-medium text-xs text-primary">
                                                    Processado em #{item.orderNumber}
                                                  </span>
                                                ) : (
                                                  <span className="text-amber-500 italic text-[11px]">
                                                    Em Aberto (Aguardando Recuperação)
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

