"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, startOfQuarter, endOfQuarter } from "date-fns";
import { toast } from "sonner";
import {
  getDreReport,
  getDreReportPdf,
  DreReport,
} from "@/services/reportsApi";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

const formatGold = (val: number) =>
  `${(Number(val) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} g`;

const formatPercent = (val: number) =>
  `${(Number(val) || 0).toFixed(2).replace(".", ",")}%`;

export default function DreReportPage() {
  const [currencyView, setCurrencyView] = useState<"BRL" | "GOLD">("BRL");
  const [startDate, setStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );

  const [reportData, setReportData] = useState<DreReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleFetchReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione as datas inicial e final.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await getDreReport({
        startDate,
        endDate,
        regime: "CAIXA",
      });
      setReportData(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao gerar a DRE.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    handleFetchReport();
  }, [handleFetchReport]);

  const handleDownloadPdf = async () => {
    if (!startDate || !endDate) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await getDreReportPdf({
        startDate,
        endDate,
        regime: "CAIXA",
        mode: currencyView,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dre_${currencyView}_${startDate}_a_${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("DRE em PDF gerada com sucesso!");
    } catch (err) {
      toast.error("Falha ao exportar PDF da DRE.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const applyPreset = (type: "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "THIS_YEAR") => {
    const now = new Date();
    if (type === "THIS_MONTH") {
      setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
    } else if (type === "LAST_MONTH") {
      const lastMonth = subMonths(now, 1);
      setStartDate(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
    } else if (type === "THIS_QUARTER") {
      setStartDate(format(startOfQuarter(now), "yyyy-MM-dd"));
      setEndDate(format(endOfQuarter(now), "yyyy-MM-dd"));
    } else if (type === "THIS_YEAR") {
      setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    }
  };

  const isLucro = reportData?.resultadoLiquido.status === "LUCRO";

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DRE &bull; Demonstração do Resultado</h1>
          <p className="text-sm text-muted-foreground">
            Visão contábil e gerencial de receitas, custos, margens e lucro líquido do período.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Switch R$ / Au */}
          <ToggleGroup
            type="single"
            value={currencyView}
            onValueChange={(val: "BRL" | "GOLD") => val && setCurrencyView(val)}
            className="bg-muted p-0.5 rounded-lg border h-9"
          >
            <ToggleGroupItem value="BRL" className="px-3 h-8 text-xs font-semibold">
              R$
            </ToggleGroupItem>
            <ToggleGroupItem value="GOLD" className="px-3 h-8 text-xs font-semibold">
              Au
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="outline"
            onClick={handleFetchReport}
            disabled={isLoading}
            className="flex-1 md:flex-none"
          >
            <RotateCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf || isLoading || !reportData}
            className="flex-1 md:flex-none"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isDownloadingPdf ? "Gerando PDF..." : "Exportar DRE (PDF)"}
          </Button>
        </div>
      </div>

      {/* Card de Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" /> Período da Demonstração
            </span>
            {reportData && (
              <span className="text-xs font-normal text-muted-foreground">
                Cotação de Referência Au: <strong>{formatCurrency(reportData.quotationAu)}/g</strong>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1">Atalhos:</span>
            <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => applyPreset("THIS_MONTH")}>
              Este Mês
            </Button>
            <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => applyPreset("LAST_MONTH")}>
              Mês Anterior
            </Button>
            <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => applyPreset("THIS_QUARTER")}>
              Trimestre Atual
            </Button>
            <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => applyPreset("THIS_YEAR")}>
              Ano Atual
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div>
              <Label className="text-xs font-medium">Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Receita Operacional
              </CardTitle>
              {currencyView === "GOLD" ? (
                <Scale className="h-4 w-4 text-amber-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-blue-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-black ${currencyView === "GOLD" ? "text-amber-500" : "text-blue-600 dark:text-blue-400"}`}>
                {currencyView === "GOLD"
                  ? formatGold(reportData.receitaBruta.totalAu || 0)
                  : formatCurrency(reportData.receitaBruta.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currencyView === "GOLD"
                  ? `Eq: ${formatCurrency(reportData.receitaBruta.total)}`
                  : `Eq: ${formatGold(reportData.receitaBruta.totalAu || 0)}`}
                {" "}&bull; {reportData.receitaBruta.items.length} grupos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Custos Operacionais
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {currencyView === "GOLD"
                  ? formatGold(reportData.custosOperacionais.totalAu || 0)
                  : formatCurrency(reportData.custosOperacionais.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currencyView === "GOLD"
                  ? `Eq: ${formatCurrency(reportData.custosOperacionais.total)}`
                  : `Eq: ${formatGold(reportData.custosOperacionais.totalAu || 0)}`}
                {" "}&bull; Custos diretos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Lucro Bruto
              </CardTitle>
              <PieChart className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {currencyView === "GOLD"
                  ? formatGold(reportData.lucroBruto.valorAu || 0)
                  : formatCurrency(reportData.lucroBruto.valor)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Margem Bruta: <strong className="text-foreground">{formatPercent(reportData.lucroBruto.margem)}</strong>
                {" "}&bull; {currencyView === "GOLD" ? formatCurrency(reportData.lucroBruto.valor) : formatGold(reportData.lucroBruto.valorAu || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${isLucro ? "border-l-emerald-600" : "border-l-rose-600"}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Resultado Líquido
              </CardTitle>
              {isLucro ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-black ${
                  isLucro ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {currencyView === "GOLD"
                  ? formatGold(reportData.resultadoLiquido.valorAu || 0)
                  : formatCurrency(reportData.resultadoLiquido.valor)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Margem Líquida:{" "}
                <strong className="text-foreground">{formatPercent(reportData.resultadoLiquido.margem)}</strong>
                {" "}&bull; {currencyView === "GOLD" ? formatCurrency(reportData.resultadoLiquido.valor) : formatGold(reportData.resultadoLiquido.valorAu || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demonstrativo Estruturado */}
      {reportData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Demonstração Detalhada das Contas de Resultado ({currencyView === "GOLD" ? "Valores em Ouro - Au" : "Valores em Moeda - R$"})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70%]">Conta Contábil / Descrição</TableHead>
                    <TableHead className="text-right w-[30%]">
                      Valor do Período ({currencyView === "GOLD" ? "Au" : "R$"})
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 1. RECEITAS */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell className="text-sm text-foreground">
                      (+) 1. RECEITA OPERACIONAL BRUTA
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${currencyView === "GOLD" ? "text-amber-500 font-bold" : "text-blue-600 dark:text-blue-400"}`}>
                      {currencyView === "GOLD"
                        ? formatGold(reportData.receitaBruta.totalAu || 0)
                        : formatCurrency(reportData.receitaBruta.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.receitaBruta.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20">
                      <TableCell className="pl-8 text-xs text-muted-foreground">
                        <span className="font-mono mr-1.5 opacity-60">{item.codigo}</span>
                        {item.nome}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* 2. CUSTOS */}
                  <TableRow className="bg-muted/50 font-bold border-t">
                    <TableCell className="text-sm text-foreground">
                      (-) 2. CUSTOS OPERACIONAIS (CPV / CMV)
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-rose-600 dark:text-rose-400">
                      - {currencyView === "GOLD" ? formatGold(reportData.custosOperacionais.totalAu || 0) : formatCurrency(reportData.custosOperacionais.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.custosOperacionais.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20">
                      <TableCell className="pl-8 text-xs text-muted-foreground">
                        <span className="font-mono mr-1.5 opacity-60">{item.codigo}</span>
                        {item.nome}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                        - {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* 3. LUCRO BRUTO */}
                  <TableRow className="bg-primary/5 font-extrabold border-t-2 border-primary/20">
                    <TableCell className="text-sm">
                      (=) 3. LUCRO BRUTO OPERACIONAL
                      <span className="ml-2 font-normal text-xs text-muted-foreground">
                        (Margem Bruta: {formatPercent(reportData.lucroBruto.margem)})
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-foreground">
                      {currencyView === "GOLD" ? formatGold(reportData.lucroBruto.valorAu || 0) : formatCurrency(reportData.lucroBruto.valor)}
                    </TableCell>
                  </TableRow>

                  {/* 4. DESPESAS OPERACIONAIS */}
                  <TableRow className="bg-muted/50 font-bold border-t">
                    <TableCell className="text-sm text-foreground">
                      (-) 4. DESPESAS OPERACIONAIS (Administrativas e Comerciais)
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-rose-600 dark:text-rose-400">
                      - {currencyView === "GOLD" ? formatGold(reportData.despesasOperacionais.totalAu || 0) : formatCurrency(reportData.despesasOperacionais.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.despesasOperacionais.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20">
                      <TableCell className="pl-8 text-xs text-muted-foreground">
                        <span className="font-mono mr-1.5 opacity-60">{item.codigo}</span>
                        {item.nome}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                        - {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* 5. RESULTADO FINANCEIRO */}
                  <TableRow className="bg-muted/50 font-bold border-t">
                    <TableCell className="text-sm text-foreground">
                      (+/-) 5. RESULTADO FINANCEIRO LÍQUIDO
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {currencyView === "GOLD" ? formatGold(reportData.resultadoFinanceiro.totalAu || 0) : formatCurrency(reportData.resultadoFinanceiro.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.resultadoFinanceiro.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20">
                      <TableCell className="pl-8 text-xs text-muted-foreground">
                        <span className="font-mono mr-1.5 opacity-60">{item.codigo}</span>
                        {item.nome}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* 6. RESULTADO LÍQUIDO FINAL */}
                  <TableRow
                    className={`font-black border-t-2 text-base ${
                      isLucro
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    <TableCell className="py-3 text-base">
                      (=) RESULTADO LÍQUIDO DO EXERCÍCIO ({reportData.resultadoLiquido.status})
                      <span className="ml-2 font-normal text-xs opacity-80">
                        (Margem Líquida: {formatPercent(reportData.resultadoLiquido.margem)})
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-lg py-3">
                      {currencyView === "GOLD" ? formatGold(reportData.resultadoLiquido.valorAu || 0) : formatCurrency(reportData.resultadoLiquido.valor)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
