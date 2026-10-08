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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Wrench,
  Layers,
  Sparkles,
} from "lucide-react";

interface InconsistencyItem {
  transacaoId: string;
  dataHora: string;
  descricao: string;
  valor: number;
  tipoTransacao: string;
  moeda: string;
  contaCorrente: {
    id: string;
    nome: string;
  } | null;
  contaContabilAtual: {
    id: string;
    codigo: string;
    nome: string;
    tipo: string;
    aceitaLancamento: boolean;
  } | null;
  tipoInconsistencia: string;
  tituloInconsistencia: string;
  severidade: "CRITICA" | "ALTA" | "MEDIA";
  descricaoProblema: string;
  sugestaoCorrecao: string;
}

interface InconsistenciesResponse {
  summary: {
    totalInconsistencies: number;
    totalAmount: number;
    bySeverity: {
      critica: number;
      alta: number;
      media: number;
    };
    byType: Record<string, number>;
  };
  items: InconsistencyItem[];
}

interface ContaContabilOption {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
}

interface ContaCorrenteOption {
  id: string;
  nome: string;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

export default function AccountingInconsistenciesPage() {
  const [data, setData] = useState<InconsistenciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingPlan, setIsSyncingPlan] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("TODOS");
  const [selectedContaCorrenteId, setSelectedContaCorrenteId] = useState("TODAS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Listas de apoio
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrenteOption[]>([]);
  const [contasContabeis, setContasContabeis] = useState<ContaContabilOption[]>([]);

  // Modal de Reclassificação
  const [itemToFix, setItemToFix] = useState<InconsistencyItem | null>(null);
  const [targetContaContabilId, setTargetContaContabilId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchContaModal, setSearchContaModal] = useState("");

  // Carregar contas correntes e contas contábeis para filtros e edição
  const loadOptions = useCallback(async () => {
    try {
      const [ccRes, ctbRes] = await Promise.all([
        api.get("/contas-correntes"),
        api.get("/contas-contabeis"),
      ]);
      setContasCorrentes(ccRes.data || []);
      setContasContabeis(ctbRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar opções:", err);
    }
  }, []);

  // Carregar relatório de inconsistências
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (selectedContaCorrenteId && selectedContaCorrenteId !== "TODAS") {
        params.set("contaCorrenteId", selectedContaCorrenteId);
      }
      if (severityFilter && severityFilter !== "TODOS") {
        params.set("type", severityFilter);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await api.get(`/reports/accounting-inconsistencies?${params.toString()}`);
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Falha ao carregar auditoria contábil.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedContaCorrenteId, severityFilter, search]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchReport]);

  // Sincronizar Plano de Contas
  const handleSyncPlan = async () => {
    setIsSyncingPlan(true);
    try {
      await api.post("/contas-contabeis/sync-standard");
      toast.success("Plano de Contas sincronizado com sucesso! Todas as categorias operacionais ativas.");
      await loadOptions();
      await fetchReport();
    } catch (err: any) {
      toast.error("Erro ao sincronizar plano de contas.");
    } finally {
      setIsSyncingPlan(false);
    }
  };

  // Abrir modal de correção
  const handleOpenFix = (item: InconsistencyItem) => {
    setItemToFix(item);
    setSearchContaModal("");
    // Se for recebimento de venda, sugere a conta 1.1.3 Contas a Receber de Clientes por padrão
    const isRecebimento = /venda|pedido|recebimento|deposito/i.test(item.tituloInconsistencia);
    if (isRecebimento) {
      const contaReceber = contasContabeis.find((c) => c.codigo === "1.1.3");
      setTargetContaContabilId(contaReceber ? contaReceber.id : "");
    } else {
      setTargetContaContabilId("");
    }
  };

  // Salvar reclassificação contábil
  const handleSaveFix = async () => {
    if (!itemToFix || !targetContaContabilId) {
      toast.error("Selecione uma conta contábil para reclassificar.");
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch(`/transacoes/${itemToFix.transacaoId}`, {
        contaContabilId: targetContaContabilId,
      });

      toast.success("Lançamento reclassificado com sucesso!");
      setItemToFix(null);

      // Atualiza localmente o item corrigido removendo-o da lista
      setData((prev) => {
        if (!prev) return null;
        const newItems = prev.items.filter((i) => i.transacaoId !== itemToFix.transacaoId);
        return {
          ...prev,
          summary: {
            ...prev.summary,
            totalInconsistencies: Math.max(0, prev.summary.totalInconsistencies - 1),
            totalAmount: Math.max(0, prev.summary.totalAmount - itemToFix.valor),
          },
          items: newItems,
        };
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao reclassificar lançamento.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Contas filtradas no modal
  const filteredContasModal = useMemo(() => {
    return contasContabeis.filter((c) => {
      if (!c.aceitaLancamento) return false;
      if (!searchContaModal.trim()) return true;
      const term = searchContaModal.toLowerCase();
      return (
        c.codigo.toLowerCase().includes(term) ||
        c.nome.toLowerCase().includes(term) ||
        c.tipo.toLowerCase().includes(term)
      );
    });
  }, [contasContabeis, searchContaModal]);

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-amber-500" />
              Auditoria de Inconsistências Contábeis
            </h1>
            <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10">
              Auditoria Automática
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Detecta e permite corrigir em lote lançamentos com divergência entre tipo financeiro (Crédito/Débito) e natureza da conta contábil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncPlan}
            disabled={isSyncingPlan}
            className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Sparkles className={`h-4 w-4 ${isSyncingPlan ? "animate-spin" : ""}`} />
            Sincronizar Plano de Contas
          </Button>

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
        <Card className="border border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Total de Alertas
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {data?.summary.totalInconsistencies || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Lançamentos com classificação divergente
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Valor Total Impactado
              <Layers className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {formatCurrency(data?.summary.totalAmount || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Soma financeira das movimentações sob alerta
          </CardContent>
        </Card>

        <Card className="border border-red-500/20 shadow-sm bg-red-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-red-500 flex items-center justify-between">
              Alertas Críticos
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-500">
              {data?.summary.bySeverity.critica || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-red-400">
            Vendas em Fornecedores ou Compras em Receita
          </CardContent>
        </Card>

        <Card className="border border-amber-500/20 shadow-sm bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center justify-between">
              Inconsistência de Natureza
              <Filter className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-500">
              {data?.summary.bySeverity.alta || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-400">
            Créditos em Despesa ou Débitos em Receita
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card className="border border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Busca textual */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar descrição, conta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Conta Corrente */}
            <div>
              <Select
                value={selectedContaCorrenteId}
                onValueChange={setSelectedContaCorrenteId}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Conta Corrente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Contas Bancárias</SelectItem>
                  {contasCorrentes.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gravidade */}
            <div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Gravidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas as Gravidades</SelectItem>
                  <SelectItem value="CRITICA">🔴 Crítica (Venda em Fornecedor, etc)</SelectItem>
                  <SelectItem value="ALTA">🟠 Alta (Crédito em Despesa / Débito em Receita)</SelectItem>
                  <SelectItem value="MEDIA">🔵 Média (Sem Conta / Conta Sintética)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Inicial */}
            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Data Final */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm flex-1"
              />
              {(startDate || endDate || search || selectedContaCorrenteId !== "TODAS" || severityFilter !== "TODOS") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSearch("");
                    setSelectedContaCorrenteId("TODAS");
                    setSeverityFilter("TODOS");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Inconsistências */}
      <Card className="border border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição & Conta Bancária</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Conta Contábil Atual</th>
                <th className="px-4 py-3">Problema Detectado</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span>Analisando lançamentos e auditando regras contábeis...</span>
                    </div>
                  </td>
                </tr>
              ) : !data?.items || data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <p className="text-base font-medium text-foreground">
                        Nenhuma inconsistência contábil encontrada!
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Todos os lançamentos do período selecionado estão classificados em conformidade com as regras contábeis.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((item) => {
                  const isCredit = item.tipoTransacao === "CREDITO";
                  const severityBadge =
                    item.severidade === "CRITICA" ? (
                      <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-semibold">
                        CRÍTICA
                      </Badge>
                    ) : item.severidade === "ALTA" ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold">
                        ALTA
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-semibold">
                        MÉDIA
                      </Badge>
                    );

                  return (
                    <tr
                      key={item.transacaoId}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Data */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {formatDate(item.dataHora)}
                      </td>

                      {/* Descrição & Conta Corrente */}
                      <td className="px-4 py-3 max-w-xs sm:max-w-md">
                        <div className="font-medium text-foreground leading-snug line-clamp-2">
                          {item.descricao || "(Sem descrição)"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span className="font-medium">{item.contaCorrente?.nome || "Conta não identificada"}</span>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold ${
                            isCredit ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {formatCurrency(item.valor)}
                        </span>
                      </td>

                      {/* Conta Contábil Atual */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.contaContabilAtual ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-xs text-foreground">
                              {item.contaContabilAtual.codigo} - {item.contaContabilAtual.nome}
                            </span>
                            <Badge
                              variant="outline"
                              className="w-fit text-[10px] px-1.5 py-0 font-normal uppercase"
                            >
                              {item.contaContabilAtual.tipo}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            Sem Conta Contábil
                          </Badge>
                        )}
                      </td>

                      {/* Problema & Sugestão */}
                      <td className="px-4 py-3 min-w-[260px] max-w-sm">
                        <div className="flex items-center gap-2 mb-1">
                          {severityBadge}
                          <span className="text-xs font-semibold text-foreground">
                            {item.tituloInconsistencia}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.descricaoProblema}
                        </p>
                        <p className="text-[11px] text-primary/90 mt-1 font-medium bg-primary/5 p-1.5 rounded border border-primary/10">
                          👉 {item.sugestaoCorrecao}
                        </p>
                      </td>

                      {/* Ação */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenFix(item)}
                          className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          Reclassificar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Reclassificação Direta */}
      <Dialog open={!!itemToFix} onOpenChange={(open) => !open && setItemToFix(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-primary" />
              Reclassificar Conta Contábil
            </DialogTitle>
            <DialogDescription>
              Selecione a categoria contábil correta para atualizar este lançamento imediatamente.
            </DialogDescription>
          </DialogHeader>

          {itemToFix && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 p-3 rounded-lg border border-border/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-mono text-foreground">{formatDate(itemToFix.dataHora)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(itemToFix.valor)} ({itemToFix.tipoTransacao})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conta Corrente:</span>
                  <span className="font-medium text-foreground">{itemToFix.contaCorrente?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descrição:</span>
                  <span className="font-medium text-foreground text-right max-w-[260px] truncate">
                    {itemToFix.descricao}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5 mt-1.5">
                  <span className="text-muted-foreground">Classificação Atual:</span>
                  <span className="font-semibold text-rose-500">
                    {itemToFix.contaContabilAtual
                      ? `${itemToFix.contaContabilAtual.codigo} - ${itemToFix.contaContabilAtual.nome}`
                      : "(Nenhuma)"}
                  </span>
                </div>
              </div>

              {/* Sugestão Rápida */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded text-xs text-amber-500">
                <span className="font-semibold block mb-0.5">Diagnóstico:</span>
                {itemToFix.sugestaoCorrecao}
              </div>

              {/* Seletor de Nova Conta Contábil */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Selecione a Nova Conta Contábil:
                </label>

                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar contas (ex: Clientes, Venda, Almoço, Frete...)"
                    value={searchContaModal}
                    onChange={(e) => setSearchContaModal(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-border rounded-md divide-y divide-border/60">
                  {filteredContasModal.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      Nenhuma conta contábil analítica encontrada com esse termo.
                    </div>
                  ) : (
                    filteredContasModal.map((c) => {
                      const isSelected = targetContaContabilId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setTargetContaContabilId(c.id)}
                          className={`w-full text-left p-2.5 text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-primary/15 text-primary font-semibold"
                              : "hover:bg-muted/40 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground text-[11px]">{c.codigo}</span>
                            <span>{c.nome}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {c.tipo}
                          </Badge>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemToFix(null)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFix}
              disabled={!targetContaContabilId || isUpdating}
              className="bg-primary text-primary-foreground flex items-center gap-1.5"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirmar Reclassificação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
