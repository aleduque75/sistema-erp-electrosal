"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  getExpensesReport,
  getExpensesReportPdf,
  ExpensesReport,
  ExpenseItem,
} from "@/services/reportsApi";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
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
  DollarSign,
  Scale,
  CheckCircle2,
  Clock,
  PieChart,
  ArrowUpDown,
  Filter,
} from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

const formatGold = (val: number) =>
  `${(Number(val) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} g`;

export default function ExpensesReportPage() {
  const [startDate, setStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string>("all");
  const [selectedContaCorrenteId, setSelectedContaCorrenteId] = useState<string>("all");

  const [searchTerm, setSearchTerm] = useState("");

  const [contasContabeis, setContasContabeis] = useState<{ id: string; codigo: string; nome: string }[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string; name: string }[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<{ id: string; nome: string }[]>([]);

  const [reportData, setReportData] = useState<ExpensesReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Carregar filtros auxiliares
  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const [ccRes, fornRes, accRes] = await Promise.all([
          api.get("/contas-contabeis"),
          api.get("/pessoas?role=FORNECEDOR"),
          api.get("/contas-correntes"),
        ]);
        setContasContabeis(ccRes.data || []);
        setFornecedores(fornRes.data || []);
        setContasCorrentes(accRes.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados auxiliares:", err);
      }
    };
    loadAuxData();
  }, []);

  const handleFetchReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione as datas inicial e final.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await getExpensesReport({
        startDate,
        endDate,
        contaContabilId: selectedCategoriaId !== "all" ? selectedCategoriaId : undefined,
        fornecedorId: selectedFornecedorId !== "all" ? selectedFornecedorId : undefined,
        contaCorrenteId: selectedContaCorrenteId !== "all" ? selectedContaCorrenteId : undefined,
        status: statusFilter,
      });
      setReportData(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao gerar relatório de despesas.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedCategoriaId, selectedFornecedorId, selectedContaCorrenteId, statusFilter]);

  useEffect(() => {
    handleFetchReport();
  }, [handleFetchReport]);

  // Exportar PDF
  const handleDownloadPdf = async () => {
    if (!startDate || !endDate) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await getExpensesReportPdf({
        startDate,
        endDate,
        contaContabilId: selectedCategoriaId !== "all" ? selectedCategoriaId : undefined,
        fornecedorId: selectedFornecedorId !== "all" ? selectedFornecedorId : undefined,
        contaCorrenteId: selectedContaCorrenteId !== "all" ? selectedContaCorrenteId : undefined,
        status: statusFilter,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_despesas_${startDate}_a_${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF baixado com sucesso!");
    } catch (err) {
      toast.error("Falha ao gerar o arquivo PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Presets de Data
  const applyPreset = (type: "THIS_MONTH" | "LAST_MONTH" | "LAST_30" | "THIS_YEAR") => {
    const now = new Date();
    if (type === "THIS_MONTH") {
      setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
    } else if (type === "LAST_MONTH") {
      const lastMonth = subMonths(now, 1);
      setStartDate(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
    } else if (type === "LAST_30") {
      setStartDate(format(subDays(now, 30), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    } else if (type === "THIS_YEAR") {
      setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    }
  };

  // Filtragem local na tabela por texto
  const filteredEntries = useMemo(() => {
    if (!reportData?.entries) return [];
    if (!searchTerm.trim()) return reportData.entries;
    const term = searchTerm.toLowerCase();
    return reportData.entries.filter(
      (e) =>
        e.descricao.toLowerCase().includes(term) ||
        (e.fornecedorNome && e.fornecedorNome.toLowerCase().includes(term)) ||
        (e.contaContabilNome && e.contaContabilNome.toLowerCase().includes(term)) ||
        (e.contaCorrenteNome && e.contaCorrenteNome.toLowerCase().includes(term))
    );
  }, [reportData, searchTerm]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatório Analítico de Despesas</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe gastos operacionais, centros de custo, saídas e compromissos futuros.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
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
            disabled={isDownloadingPdf || isLoading || !reportData?.entries.length}
            className="flex-1 md:flex-none"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isDownloadingPdf ? "Gerando PDF..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      {/* Card de Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" /> Filtros do Período e Parâmetros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Presets Rápidos */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1">Atalhos:</span>
            <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => applyPreset("THIS_MONTH")}>
              Este Mês
            </Button>
            <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => applyPreset("LAST_MONTH")}>
              Mês Anterior
            </Button>
            <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => applyPreset("LAST_30")}>
              Últimos 30 Dias
            </Button>
            <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => applyPreset("THIS_YEAR")}>
              Ano Atual
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
            <div>
              <Label className="text-xs font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas (Pagas + A Pagar)</SelectItem>
                  <SelectItem value="PAID">Apenas Pagas (Débitos)</SelectItem>
                  <SelectItem value="PENDING">Apenas Pendentes (A Pagar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Categoria Contábil</Label>
              <div className="mt-1">
                <Combobox
                  options={[
                    { value: "all", label: "Todas as Categorias" },
                    ...contasContabeis.map((c) => ({
                      value: c.id,
                      label: `${c.codigo} - ${c.nome}`,
                    })),
                  ]}
                  value={selectedCategoriaId}
                  onChange={(val) => setSelectedCategoriaId(val || "all")}
                  placeholder="Todas as categorias"
                  searchPlaceholder="Buscar categoria..."
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Fornecedor</Label>
              <div className="mt-1">
                <Combobox
                  options={[
                    { value: "all", label: "Todos os Fornecedores" },
                    ...fornecedores.map((f) => ({
                      value: f.id,
                      label: f.name,
                    })),
                  ]}
                  value={selectedFornecedorId}
                  onChange={(val) => setSelectedFornecedorId(val || "all")}
                  placeholder="Todos os fornecedores"
                  searchPlaceholder="Buscar fornecedor..."
                />
              </div>
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
                Total de Despesas
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(reportData.summary.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {reportData.summary.count} lançamentos no período
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Equivalente em Ouro
              </CardTitle>
              <Scale className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatGold(reportData.summary.totalGold)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculado nas cotações diárias
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Despesas Pagas
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(reportData.summary.totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Efetivadas em conta corrente / caixa
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Pendentes (A Pagar)
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600">
                {formatCurrency(reportData.summary.totalPending)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Títulos com vencimento no período
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo por Categoria Contábil */}
      {reportData && reportData.summary.byCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" /> Distribuição por Categoria Contábil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportData.summary.byCategory.slice(0, 9).map((cat) => (
                <div
                  key={cat.contaContabilId}
                  className="p-3 rounded-lg border border-border bg-card/60 space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-foreground line-clamp-1" title={cat.nome}>
                      {cat.nome}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-primary">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs text-muted-foreground">
                    <span className="font-mono text-foreground font-semibold">
                      {formatCurrency(cat.totalAmount)}
                    </span>
                    <span className="text-[10px]">{cat.count} lanç.</span>
                  </div>
                  {/* Barra de Progresso visual */}
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela Analítica Detalhada */}
      <Card>
        <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-base font-semibold">
            Detalhamento Analítico ({filteredEntries.length} itens)
          </CardTitle>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Pesquisar nos resultados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria Contábil</TableHead>
                  <TableHead>Conta / Origem</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="text-right">Valor (R$)</TableHead>
                  <TableHead className="text-right">Ouro (Au)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Carregando relatório de despesas...
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Nenhuma despesa encontrada para o filtro selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {format(new Date(item.dataHora), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium text-xs max-w-[200px] truncate" title={item.descricao}>
                        {item.descricao}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {item.fornecedorNome || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-mono text-[10px] text-muted-foreground mr-1">
                          {item.contaContabilCodigo}
                        </span>
                        {item.contaContabilNome}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.contaCorrenteNome}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === "PAGO" ? "default" : "secondary"}
                          className="text-[10px] py-0 h-5"
                        >
                          {item.status === "PAGO" ? "Pago" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        {formatCurrency(item.valor)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                        {item.goldAmount ? formatGold(item.goldAmount) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
