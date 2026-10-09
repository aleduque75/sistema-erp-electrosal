"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  X,
  User,
  Calendar,
  Scale,
  Eye,
  Edit,
  CreditCard,
  Wallet,
  Coins,
  Printer,
  CheckCircle2,
  Users,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownZA,
} from "lucide-react";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { MetalCreditWithUsageDto } from "@/types/metal-credit-with-usage.dto";
import { Button } from "@/components/ui/button";
import { MetalCreditDetailsModal } from "@/components/metal-credits/MetalCreditDetailsModal";
import { ChemicalAnalysisDetailsModal } from "@/components/metal-credits/ChemicalAnalysisDetailsModal";
import { PayWithCashModal } from "@/components/metal-credits/PayWithCashModal";
import { EditMetalCreditModal } from "@/components/metal-credits/EditMetalCreditModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { formatDate } from "@/lib/date-utils";

const formatGrams = (value?: number) => {
  return (
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0) + " g"
  );
};

// Status Configuration
const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  PENDING: { label: "Disponível", color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800", dot: "bg-emerald-500" },
  PARTIALLY_PAID: { label: "Parcialmente Usado", color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800", dot: "bg-amber-500" },
  PAID: { label: "Esgotado / Pago", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", dot: "bg-slate-400" },
  CANCELED: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800", dot: "bg-red-500" },
};

export default function CreditosClientesPage() {
  const { user, isLoading } = useAuth();
  const [credits, setCredits] = useState<MetalCreditWithUsageDto[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isPayWithCashModalOpen, setPayWithCashModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<MetalCreditWithUsageDto | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [selectedAnalysisClientName, setSelectedAnalysisClientName] = useState<string>("");
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // Quick liquidate state from page
  const [creditToLiquidate, setCreditToLiquidate] = useState<MetalCreditWithUsageDto | null>(null);
  const [isLiquidating, setIsLiquidating] = useState(false);

  // Filtros
  const [metalTypeFilter, setMetalTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [hideZeroed, setHideZeroed] = useState(true);
  const [sortBy, setSortBy] = useState<"date-asc" | "date-desc" | "client-asc" | "client-desc" | "grams-desc">("date-asc");

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const creditsResponse = await api.get<MetalCreditWithUsageDto[]>("/metal-credits");
      setCredits(Array.isArray(creditsResponse.data) ? creditsResponse.data : []);
    } catch (err: any) {
      console.error("Erro ao carregar créditos de metal:", err);
      toast.error(err?.response?.data?.message || "Falha ao carregar dados.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !isLoading) fetchData();
  }, [user, isLoading]);

  const handleViewDetails = (credit: MetalCreditWithUsageDto) => {
    setSelectedCredit(credit);
    setDetailsModalOpen(true);
  };

  const handlePayWithCash = (credit: MetalCreditWithUsageDto) => {
    setSelectedCredit(credit);
    setPayWithCashModalOpen(true);
  };

  const handleEdit = (credit: MetalCreditWithUsageDto) => {
    setSelectedCredit(credit);
    setEditModalOpen(true);
  };

  const handlePrintPdf = async (credit: MetalCreditWithUsageDto) => {
    const toastId = toast.loading("Gerando extrato PDF...");
    try {
      const response = await api.get(`/metal-credits/${credit.id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `extrato-credito-${credit.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF baixado com sucesso!", { id: toastId });
    } catch (error) {
      toast.error("Falha ao gerar o PDF.", { id: toastId });
    }
  };

  const handleLiquidateConfirm = async () => {
    if (!creditToLiquidate) return;
    try {
      setIsLiquidating(true);
      await api.post(`/metal-credits/${creditToLiquidate.id}/liquidate`, {
        notes: "Liquidação de saldo residual via painel de créditos",
      });
      toast.success("Saldo residual liquidado com sucesso!");
      setCreditToLiquidate(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao liquidar saldo do crédito.");
    } finally {
      setIsLiquidating(false);
    }
  };

  // Métricas de Resumo
  const metrics = useMemo(() => {
    let totalAuAvailable = 0;
    let totalAgAvailable = 0;
    let activeCreditsCount = 0;
    const clientsWithActiveBalance = new Set<string>();

    credits.forEach((c) => {
      const g = Number(c.grams || 0);
      if (g > 0.0001 && c.status !== "PAID" && c.status !== "CANCELED") {
        if (c.metalType === "AU") totalAuAvailable += g;
        if (c.metalType === "AG") totalAgAvailable += g;
        activeCreditsCount++;
        if (c.clientId) clientsWithActiveBalance.add(c.clientId);
      }
    });

    return {
      totalAuAvailable,
      totalAgAvailable,
      activeClientsCount: clientsWithActiveBalance.size,
      activeCreditsCount,
      totalCreditsCount: credits.length,
    };
  }, [credits]);

  const filteredCredits = useMemo(() => {
    const list = credits.filter((credit) => {
      const matchesMetalType = metalTypeFilter === "ALL" || credit.metalType === metalTypeFilter;
      const matchesStatus = statusFilter === "ALL" || credit.status === statusFilter;
      const isNotZeroed = !hideZeroed || Number(credit.grams) > 0.0001;

      let matchesDate = true;
      if (dateRange?.from) {
        const creditDate = new Date(credit.date);
        const start = startOfDay(dateRange.from);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        matchesDate = isWithinInterval(creditDate, { start, end });
      }

      return matchesMetalType && matchesStatus && matchesDate && isNotZeroed;
    });

    return list.sort((a, b) => {
      if (sortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "client-asc") {
        return (a.clientName || "").localeCompare(b.clientName || "");
      }
      if (sortBy === "client-desc") {
        return (b.clientName || "").localeCompare(a.clientName || "");
      }
      if (sortBy === "grams-desc") {
        return Number(b.grams || 0) - Number(a.grams || 0);
      }
      return 0;
    });
  }, [credits, metalTypeFilter, statusFilter, dateRange, hideZeroed, sortBy]);

  const clearFilters = () => {
    setMetalTypeFilter("ALL");
    setStatusFilter("ALL");
    setDateRange(undefined);
    setSortBy("date-asc");
  };

  const columns: ColumnDef<MetalCreditWithUsageDto>[] = [
    {
      accessorKey: "clientName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const nextSort = sortBy === "client-asc" ? "client-desc" : "client-asc";
            setSortBy(nextSort);
            column.toggleSorting(nextSort === "client-asc");
          }}
          className="-ml-3 h-8 text-xs font-semibold flex items-center gap-1 hover:text-primary"
        >
          Cliente
          <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-foreground">
          {row.original.clientName || "Cliente não encontrado"}
        </div>
      ),
    },
    {
      accessorKey: "origem",
      header: "Origem",
      cell: ({ row }) => {
        const analysis = row.original.chemicalAnalysis;
        if (analysis?.numeroAnalise) {
          const rawNum = String(analysis.numeroAnalise);
          const cleanNum = rawNum.replace(/^[#\s]*crr-?/i, "").trim();
          const displayLabel = `#CRR-${cleanNum || rawNum}`;

          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAnalysis(analysis);
                setSelectedAnalysisClientName(row.original.clientName || "");
                setIsAnalysisModalOpen(true);
              }}
              className="inline-flex items-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
              title="Clique para ver os detalhes da análise de origem"
            >
              <Badge
                variant="outline"
                className="font-mono text-xs bg-primary/5 hover:bg-primary/15 text-primary border-primary/20 hover:border-primary/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{displayLabel}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
              </Badge>
            </button>
          );
        }
        return <span className="text-xs text-muted-foreground">Manual</span>;
      },
    },
    {
      accessorKey: "metalType",
      header: "Metal",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.metalType === "AU"
              ? "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-bold"
              : "border-slate-500/40 text-slate-700 dark:text-slate-300 bg-slate-500/10 font-bold"
          }
        >
          {row.original.metalType}
        </Badge>
      ),
    },
    {
      accessorKey: "grams",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSortBy("grams-desc");
            column.toggleSorting(true);
          }}
          className="-ml-3 h-8 text-xs font-semibold flex items-center gap-1 hover:text-primary"
        >
          Saldo Atual (g)
          <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
        </Button>
      ),
      cell: ({ row }) => {
        const current = Number(row.original.grams || 0);
        return (
          <span className={`font-bold ${current > 0.0001 ? "text-primary text-base" : "text-muted-foreground"}`}>
            {formatGrams(current)}
          </span>
        );
      },
    },
    {
      id: "originalGrams",
      header: "Peso Original (g)",
      cell: ({ row }) => {
        const current = Number(row.original.grams || 0);
        const settled = Number(row.original.settledGrams || 0);
        const original = current + settled;
        return (
          <span className="text-xs text-muted-foreground font-mono">
            {formatGrams(original)}
          </span>
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const nextSort = sortBy === "date-asc" ? "date-desc" : "date-asc";
            setSortBy(nextSort);
            column.toggleSorting(nextSort === "date-asc");
          }}
          className="-ml-3 h-8 text-xs font-semibold flex items-center gap-1 hover:text-primary"
        >
          Data Origem
          {sortBy === "date-asc" ? (
            <ArrowUpAZ className="h-3.5 w-3.5 ml-1 text-primary" />
          ) : sortBy === "date-desc" ? (
            <ArrowDownZA className="h-3.5 w-3.5 ml-1 text-primary" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
          )}
        </Button>
      ),
      cell: ({ row }) => formatDate(row.original.date as unknown as string),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusInfo = statusConfig[row.original.status] || {
          label: row.original.status,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          dot: "bg-gray-400",
        };
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} border`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dot}`} />
            {statusInfo.label}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const credit = row.original;
        const hasRemainingBalance = Number(credit.grams) > 0.0001 && credit.status !== "PAID";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Ações do Crédito</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(credit)}>
                <Eye className="mr-2 h-4 w-4 text-primary" /> Visualizar Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintPdf(credit)}>
                <Printer className="mr-2 h-4 w-4 text-muted-foreground" /> Imprimir Extrato PDF
              </DropdownMenuItem>
              {hasRemainingBalance && (
                <DropdownMenuItem
                  onClick={() => setCreditToLiquidate(credit)}
                  className="text-amber-700 dark:text-amber-400 focus:text-amber-800"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-amber-600" /> Liquidar Saldo Residual
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleEdit(credit)}>
                <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Wallet className="mr-2 h-4 w-4 text-emerald-600" /> Pagar Cliente
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/metal-payments/pay-client?clientId=${credit.clientId}&metalType=${credit.metalType}&grams=${credit.grams}&creditId=${credit.id}`}
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Pagar com Metal Físico
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePayWithCash(credit)}>
                    <Coins className="mr-2 h-4 w-4" /> Pagar em Dinheiro (BRL)
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) return <p className="text-center p-10">Carregando...</p>;
  if (!user) return <p className="text-center p-10">Faça login para continuar.</p>;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Créditos de Metal</h1>
          <p className="text-muted-foreground">
            Gerencie o saldo e extrato individual de metal devido aos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Ouro (AU) em Aberto
              </span>
              <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {formatGrams(metrics.totalAuAvailable)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Saldo total devido em ouro aos clientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-500/20 bg-slate-500/5">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Prata (AG) em Aberto
              </span>
              <Scale className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-200">
              {formatGrams(metrics.totalAgAvailable)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Saldo total devido em prata aos clientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Clientes com Saldo
              </span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-black text-primary">
              {metrics.activeClientsCount}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Clientes com créditos ativos para resgate
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Créditos em Aberto
              </span>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {metrics.activeCreditsCount}
              <span className="text-xs text-muted-foreground font-normal ml-1">
                / {metrics.totalCreditsCount} total
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lotes com saldo pendente de quitação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-lg border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-md">
            <Checkbox
              id="hide-zeroed"
              checked={hideZeroed}
              onCheckedChange={(checked) => setHideZeroed(checked as boolean)}
            />
            <Label htmlFor="hide-zeroed" className="text-xs font-medium whitespace-nowrap cursor-pointer">
              Ocultar zerados
            </Label>
          </div>

          <DateRangePicker date={dateRange} onDateChange={setDateRange} />

          <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Metal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos Metais</SelectItem>
              <SelectItem value="AU">Ouro (AU)</SelectItem>
              <SelectItem value="AG">Prata (AG)</SelectItem>
              <SelectItem value="RH">Ródio (RH)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos Status</SelectItem>
              <SelectItem value="PENDING">Disponível</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Parcialmente Usado</SelectItem>
              <SelectItem value="PAID">Esgotado / Pago</SelectItem>
              <SelectItem value="CANCELED">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[190px] h-9 text-xs font-medium">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Data Origem: A / Z (Mais Antiga)</SelectItem>
              <SelectItem value="date-desc">Data Origem: Z / A (Mais Recente)</SelectItem>
              <SelectItem value="client-asc">Cliente: A - Z</SelectItem>
              <SelectItem value="client-desc">Cliente: Z - A</SelectItem>
              <SelectItem value="grams-desc">Saldo: Maior p/ Menor</SelectItem>
            </SelectContent>
          </Select>

          {(metalTypeFilter !== "ALL" || statusFilter !== "ALL" || dateRange || !hideZeroed || sortBy !== "date-asc") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="pt-6">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando créditos de metal...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCredits}
              filterColumnId="clientName"
              filterPlaceholder="Pesquisar por cliente..."
            />
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <MetalCreditDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        credit={selectedCredit}
        onSuccess={fetchData}
        onViewAnalysis={(analysis) => {
          setSelectedAnalysis(analysis);
          setSelectedAnalysisClientName(selectedCredit?.clientName || "");
          setIsAnalysisModalOpen(true);
        }}
      />

      <ChemicalAnalysisDetailsModal
        isOpen={isAnalysisModalOpen}
        onClose={() => {
          setIsAnalysisModalOpen(false);
          setSelectedAnalysis(null);
        }}
        initialAnalysis={selectedAnalysis}
        analysisId={selectedAnalysis?.id}
        clientName={selectedAnalysisClientName}
      />

      <PayWithCashModal
        isOpen={isPayWithCashModalOpen}
        onClose={() => setPayWithCashModalOpen(false)}
        credit={selectedCredit}
      />

      <EditMetalCreditModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        credit={selectedCredit}
      />

      {/* Confirm Liquidation Modal from Page */}
      <AlertDialog
        open={!!creditToLiquidate}
        onOpenChange={(open) => !open && setCreditToLiquidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Liquidar Saldo Residual do Crédito?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-left">
              <p>
                Deseja liquidar definitivamente o saldo residual de{" "}
                <strong className="text-foreground">
                  {formatGrams(Number(creditToLiquidate?.grams))}
                </strong>{" "}
                ({creditToLiquidate?.metalType}) do cliente{" "}
                <strong className="text-foreground">
                  {creditToLiquidate?.clientName}
                </strong>
                ?
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-xs text-amber-900 dark:text-amber-200">
                Esta ação dará baixa no saldo, mudará o status do crédito para{" "}
                <strong>Esgotado / Pago</strong> e registrará o ajuste contábil de metal.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLiquidating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLiquidateConfirm}
              disabled={isLiquidating}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLiquidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Liquidando...
                </>
              ) : (
                "Confirmar Liquidação"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
