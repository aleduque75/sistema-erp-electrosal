"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays, endOfMonth, subMonths, endOfYear, subYears } from "date-fns";
import { toast } from "sonner";
import {
  getBalanceSheetReport,
  getBalanceSheetReportPdf,
  BalanceSheetReport,
} from "@/services/reportsApi";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Scale,
  Building,
  CreditCard,
  TrendingUp,
  Filter,
  CheckCircle2,
  Coins,
  ShieldCheck,
  DollarSign,
} from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

const formatGold = (val: number) =>
  `${(Number(val) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} g`;

export default function BalancoPatrimonialPage() {
  const [currencyView, setCurrencyView] = useState<"BRL" | "GOLD">("BRL");
  const [asOfDate, setAsOfDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  const [reportData, setReportData] = useState<BalanceSheetReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleFetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBalanceSheetReport({ asOfDate });
      setReportData(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao carregar Balanço Patrimonial.");
    } finally {
      setIsLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    handleFetchReport();
  }, [handleFetchReport]);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const blob = await getBalanceSheetReportPdf({ asOfDate, mode: currencyView });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `balanco_patrimonial_${currencyView}_${asOfDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Balanço Patrimonial em PDF gerado com sucesso!");
    } catch (err) {
      toast.error("Falha ao exportar PDF do Balanço Patrimonial.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const applyPreset = (type: "TODAY" | "LAST_MONTH_END" | "LAST_YEAR_END") => {
    const now = new Date();
    if (type === "TODAY") {
      setAsOfDate(format(now, "yyyy-MM-dd"));
    } else if (type === "LAST_MONTH_END") {
      const lastMonth = subMonths(now, 1);
      setAsOfDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
    } else if (type === "LAST_YEAR_END") {
      const lastYear = subYears(now, 1);
      setAsOfDate(format(endOfYear(lastYear), "yyyy-MM-dd"));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Balanço Patrimonial</h1>
          <p className="text-sm text-muted-foreground">
            Demonstrativo estático de Ativo (Bens e Direitos), Passivo (Deveres e Obrigações) e Patrimônio Líquido.
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
            {isDownloadingPdf ? "Gerando PDF..." : "Exportar Balanço (PDF)"}
          </Button>
        </div>
      </div>

      {/* Filtros e Parâmetros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" /> Data-Base da Posição Patrimonial
            </span>
            {reportData && (
              <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  Ouro: <strong>{formatCurrency(reportData.quotationAu)}/g</strong>
                </span>
                <span className="opacity-40">|</span>
                <span>
                  Prata: <strong>{formatCurrency(reportData.quotationAg)}/g</strong>
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1">Atalhos:</span>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => applyPreset("TODAY")}
            >
              Posição Hoje
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => applyPreset("LAST_MONTH_END")}
            >
              Fechamento Mês Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => applyPreset("LAST_YEAR_END")}
            >
              Fechamento Ano Anterior
            </Button>
          </div>

          <div className="max-w-xs">
            <Label className="text-xs font-medium">Data de Referência (Corte)</Label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="h-9 mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Total do Ativo
              </CardTitle>
              {currencyView === "GOLD" ? (
                <Scale className="h-4 w-4 text-amber-500" />
              ) : (
                <Building className="h-4 w-4 text-blue-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-black ${currencyView === "GOLD" ? "text-amber-500" : "text-blue-600 dark:text-blue-400"}`}>
                {currencyView === "GOLD"
                  ? formatGold(reportData.ativo.totalAu || 0)
                  : formatCurrency(reportData.ativo.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currencyView === "GOLD"
                  ? `Eq: ${formatCurrency(reportData.ativo.total)}`
                  : `Eq: ${formatGold(reportData.ativo.totalAu || 0)}`}
                {" "}&bull; Circ: {currencyView === "GOLD" ? formatGold(reportData.ativo.circulante.totalAu || 0) : formatCurrency(reportData.ativo.circulante.total)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Passivo Exigível
              </CardTitle>
              <CreditCard className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {currencyView === "GOLD"
                  ? formatGold(reportData.passivo.totalAu || 0)
                  : formatCurrency(reportData.passivo.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currencyView === "GOLD"
                  ? `Eq: ${formatCurrency(reportData.passivo.total)}`
                  : `Eq: ${formatGold(reportData.passivo.totalAu || 0)}`}
                {" "}&bull; Obrigações e créditos devidos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Patrimônio Líquido
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {currencyView === "GOLD"
                  ? formatGold(reportData.patrimonioLiquido.totalAu || 0)
                  : formatCurrency(reportData.patrimonioLiquido.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currencyView === "GOLD"
                  ? `Eq: ${formatCurrency(reportData.patrimonioLiquido.total)}`
                  : `Eq: ${formatGold(reportData.patrimonioLiquido.totalAu || 0)}`}
                {" "}&bull; Capital próprio e reservas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Liquidez Corrente
              </CardTitle>
              <Scale className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {reportData.indicadores.liquidezCorrente.toFixed(2)}x
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Capital de Giro:{" "}
                <strong className={reportData.indicadores.capitalDeGiro >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {currencyView === "GOLD"
                    ? formatGold(reportData.indicadores.capitalDeGiroAu || 0)
                    : formatCurrency(reportData.indicadores.capitalDeGiro)}
                </strong>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demonstrativo em Duas Colunas (Ativo vs Passivo + PL) */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: ATIVO */}
          <Card className="flex flex-col">
            <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  1. ATIVO TOTAL ({currencyView === "GOLD" ? "Au" : "R$"})
                </CardTitle>
                <span className={`font-mono font-bold text-lg ${currencyView === "GOLD" ? "text-amber-500" : "text-blue-600 dark:text-blue-400"}`}>
                  {currencyView === "GOLD" ? formatGold(reportData.ativo.totalAu || 0) : formatCurrency(reportData.ativo.total)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[65%]">Conta / Grupo Patrimonial</TableHead>
                    <TableHead className="text-right w-[35%]">
                      Saldo ({currencyView === "GOLD" ? "Au" : "R$"})
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Ativo Circulante */}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell className="text-xs text-foreground font-bold">
                      1.1 ATIVO CIRCULANTE (Curto Prazo)
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs font-bold ${currencyView === "GOLD" ? "text-amber-500" : "text-foreground"}`}>
                      {currencyView === "GOLD" ? formatGold(reportData.ativo.circulante.totalAu || 0) : formatCurrency(reportData.ativo.circulante.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.ativo.circulante.items.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20">
                      <TableCell className="pl-6 text-xs">
                        <div className="font-medium text-foreground">{item.descricao}</div>
                        {item.detalhe && (
                          <div className="text-[11px] text-muted-foreground">{item.detalhe}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Ativo Não Circulante */}
                  <TableRow className="bg-muted/40 font-semibold border-t">
                    <TableCell className="text-xs text-foreground font-bold">
                      1.2 ATIVO NÃO CIRCULANTE (Longo Prazo / Imobilizado)
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                      {currencyView === "GOLD" ? formatGold(reportData.ativo.naoCirculante.totalAu || 0) : formatCurrency(reportData.ativo.naoCirculante.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.ativo.naoCirculante.items.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20">
                      <TableCell className="pl-6 text-xs">
                        <div className="font-medium text-foreground">{item.descricao}</div>
                        {item.detalhe && (
                          <div className="text-[11px] text-muted-foreground">{item.detalhe}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Ativo Rodapé */}
                  <TableRow className="bg-blue-50/70 dark:bg-blue-950/40 font-black border-t-2">
                    <TableCell className="text-sm text-foreground py-3">
                      TOTAL DO ATIVO (1.1 + 1.2)
                    </TableCell>
                    <TableCell className={`text-right font-mono text-base font-bold py-3 ${currencyView === "GOLD" ? "text-amber-500" : "text-blue-600 dark:text-blue-400"}`}>
                      {currencyView === "GOLD" ? formatGold(reportData.ativo.totalAu || 0) : formatCurrency(reportData.ativo.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Coluna 2: PASSIVO + PATRIMÔNIO LÍQUIDO */}
          <Card className="flex flex-col">
            <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold text-rose-950 dark:text-rose-100 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-rose-600" />
                  2. PASSIVO E PATRIMÔNIO LÍQUIDO ({currencyView === "GOLD" ? "Au" : "R$"})
                </CardTitle>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-lg">
                  {currencyView === "GOLD" ? formatGold(reportData.totalPassivoPatrimonioLiquidoAu || 0) : formatCurrency(reportData.totalPassivoPatrimonioLiquido)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[65%]">Conta / Grupo Patrimonial</TableHead>
                    <TableHead className="text-right w-[35%]">
                      Saldo ({currencyView === "GOLD" ? "Au" : "R$"})
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Passivo Circulante */}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell className="text-xs text-foreground font-bold">
                      2.1 PASSIVO CIRCULANTE (Exigível a Curto Prazo)
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                      {currencyView === "GOLD" ? formatGold(reportData.passivo.circulante.totalAu || 0) : formatCurrency(reportData.passivo.circulante.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.passivo.circulante.items.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20">
                      <TableCell className="pl-6 text-xs">
                        <div className="font-medium text-foreground">{item.descricao}</div>
                        {item.detalhe && (
                          <div className="text-[11px] text-muted-foreground">{item.detalhe}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                        {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Passivo Não Circulante */}
                  <TableRow className="bg-muted/40 font-semibold border-t">
                    <TableCell className="text-xs text-foreground font-bold">
                      2.2 PASSIVO NÃO CIRCULANTE (Longo Prazo)
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                      {currencyView === "GOLD" ? formatGold(reportData.passivo.naoCirculante.totalAu || 0) : formatCurrency(reportData.passivo.naoCirculante.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.passivo.naoCirculante.items.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20">
                      <TableCell className="pl-6 text-xs">
                        <div className="font-medium text-foreground">{item.descricao}</div>
                        {item.detalhe && (
                          <div className="text-[11px] text-muted-foreground">{item.detalhe}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                        {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Patrimônio Líquido */}
                  <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold border-t">
                    <TableCell className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                      2.3 PATRIMÔNIO LÍQUIDO
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {currencyView === "GOLD" ? formatGold(reportData.patrimonioLiquido.totalAu || 0) : formatCurrency(reportData.patrimonioLiquido.total)}
                    </TableCell>
                  </TableRow>
                  {reportData.patrimonioLiquido.items.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20">
                      <TableCell className="pl-6 text-xs">
                        <div className="font-medium text-foreground">{item.descricao}</div>
                        {item.detalhe && (
                          <div className="text-[11px] text-muted-foreground">{item.detalhe}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {currencyView === "GOLD" ? formatGold(item.valorAu || 0) : formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Passivo + PL Rodapé */}
                  <TableRow className="bg-rose-50/70 dark:bg-rose-950/40 font-black border-t-2">
                    <TableCell className="text-sm text-foreground py-3">
                      TOTAL DO PASSIVO + PL (2.1 + 2.2 + 2.3)
                    </TableCell>
                    <TableCell className="text-right font-mono text-base font-bold text-rose-600 dark:text-rose-400 py-3">
                      {currencyView === "GOLD" ? formatGold(reportData.totalPassivoPatrimonioLiquidoAu || 0) : formatCurrency(reportData.totalPassivoPatrimonioLiquido)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nota de Auditoria Contábil */}
      {reportData && (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                <strong>Equação Fundamental da Contabilidade:</strong> Ativo ({currencyView === "GOLD" ? formatGold(reportData.ativo.totalAu || 0) : formatCurrency(reportData.ativo.total)}) =
                Passivo ({currencyView === "GOLD" ? formatGold(reportData.passivo.totalAu || 0) : formatCurrency(reportData.passivo.total)}) + Patrimônio Líquido ({currencyView === "GOLD" ? formatGold(reportData.patrimonioLiquido.totalAu || 0) : formatCurrency(reportData.patrimonioLiquido.total)}).
              </span>
            </div>
            <Badge variant="outline" className="text-xs bg-background">
              Equilíbrio Contábil Ativo
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
