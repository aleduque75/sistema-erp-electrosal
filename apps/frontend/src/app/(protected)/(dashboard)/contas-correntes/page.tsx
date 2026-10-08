"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  PlusCircle,
  Landmark,
  Factory,
  Users,
  HandCoins,
  LayoutGrid,
  ArrowRight,
  Wallet,
  TrendingUp,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ContaCorrenteForm } from "./conta-corrente-form";
import { TransacaoForm } from "./transacao-form";
import { ContaCorrenteType } from "@sistema-erp-electrosal/core";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ContaCorrente {
  id: string;
  nome: string;
  numeroConta: string;
  agencia?: string;
  saldoAtualBRL: number;
  saldoAtualGold: number;
  isActive: boolean;
  type: (typeof ContaCorrenteType)[keyof typeof ContaCorrenteType];
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

const formatGold = (value?: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value || 0) + " g";

const TAB_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; badgeClass: string; desc: string }
> = {
  BANCO: {
    label: "Bancos & Caixas",
    icon: Landmark,
    color: "text-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    desc: "Contas bancárias, caixas físicos e custódia de cheques da Electrosal",
  },
  FORNECEDOR_METAL: {
    label: "Fornecedores de Metal",
    icon: Factory,
    color: "text-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    desc: "Contas correntes de fornecedores de metal (controle de insumos e saldo de metal)",
  },
  CLIENTE: {
    label: "Clientes",
    icon: Users,
    color: "text-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    desc: "Contas de clientes para controle de créditos, adiantamentos e saldo em haver",
  },
  EMPRESTIMO: {
    label: "Empréstimos & Investidores",
    icon: HandCoins,
    color: "text-purple-500",
    badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    desc: "Aportes, mútuos e contratos financeiros com investidores",
  },
  ALL: {
    label: "Todas as Contas",
    icon: LayoutGrid,
    color: "text-zinc-400",
    badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    desc: "Visão consolidada de todas as contas cadastradas no sistema",
  },
};

export default function ContasCorrentesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [contas, setContas] = useState<ContaCorrente[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [currencyMode, setCurrencyMode] = useState<"BRL" | "GOLD">("BRL");
  const [filterType, setFilterType] = useState<string>("BANCO");
  const [showInactive, setShowInactive] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState<ContaCorrente | null>(null);
  const [contaToDelete, setContaToDelete] = useState<ContaCorrente | null>(null);
  const [contaForLancamento, setContaForLancamento] = useState<ContaCorrente | null>(null);

  const fetchContas = async () => {
    setIsFetching(true);
    try {
      const params: any = {};
      if (filterType && filterType !== "ALL") {
        params.types = filterType;
      }
      if (!showInactive) {
        params.activeOnly = true;
      }

      const response = await api.get("/contas-correntes", { params });
      setContas(
        response.data.map((c: any) => ({
          ...c,
          saldoAtualBRL: parseFloat(c.saldoAtualBRL),
          saldoAtualGold: parseFloat(c.saldoAtualGold),
        }))
      );
    } catch (err) {
      toast.error("Falha ao carregar contas.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !isLoading) fetchContas();
  }, [user, isLoading, filterType, showInactive]);

  const handleSave = () => {
    setIsFormModalOpen(false);
    setContaForLancamento(null);
    fetchContas();
  };

  const handleOpenNewModal = () => {
    setContaToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (conta: ContaCorrente) => {
    setContaToEdit(conta);
    setIsFormModalOpen(true);
  };

  const handleDelete = async () => {
    if (!contaToDelete) return;
    try {
      await api.delete(`/contas-correntes/${contaToDelete.id}`);
      toast.success("Conta excluída com sucesso!");
      setContas(contas.filter((c) => c.id !== contaToDelete.id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir.");
    } finally {
      setContaToDelete(null);
    }
  };

  // Cálculos de resumo da aba atual
  const totalBRL = useMemo(
    () => contas.reduce((acc, c) => acc + (c.saldoAtualBRL || 0), 0),
    [contas]
  );
  const totalGold = useMemo(
    () => contas.reduce((acc, c) => acc + (c.saldoAtualGold || 0), 0),
    [contas]
  );
  const activeCount = useMemo(
    () => contas.filter((c) => c.isActive).length,
    [contas]
  );

  const currentTab = TAB_CONFIG[filterType] || TAB_CONFIG.ALL;
  const TabIcon = currentTab.icon;

  const columns: ColumnDef<ContaCorrente>[] = [
    {
      accessorKey: "nome",
      header: "Nome da Conta",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/contas-correntes/${row.original.id}/extrato?mode=${currencyMode}`}
            className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
          >
            {row.original.nome}
          </Link>
          {!row.original.isActive && (
            <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
              Inativa
            </span>
          )}
        </div>
      ),
    },
    { accessorKey: "numeroConta", header: "Número / ID" },
    {
      accessorKey: "agencia",
      header: "Agência",
      cell: ({ row }) => row.original.agencia || "-",
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.type;
        const config = TAB_CONFIG[type] || {
          label: type || "-",
          badgeClass: "bg-muted text-muted-foreground",
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeClass}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      id: "saldo",
      header: currencyMode === "BRL" ? "Saldo (R$)" : "Saldo (Au)",
      cell: ({ row }) => {
        const val =
          currencyMode === "BRL"
            ? row.original.saldoAtualBRL
            : row.original.saldoAtualGold;
        const formatted =
          currencyMode === "BRL" ? formatCurrency(val) : formatGold(val);

        const isNegative = val < 0;
        return (
          <span
            className={
              isNegative
                ? "text-red-500 font-bold"
                : "text-foreground font-semibold"
            }
          >
            {formatted}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <Link
                href={`/contas-correntes/${conta.id}/extrato?mode=${currencyMode}`}
                passHref
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <FileText className="mr-2 h-4 w-4" /> Ver Extrato
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => setContaForLancamento(conta)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Lançamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEditModal(conta)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setContaToDelete(conta)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-6 mx-auto my-6 max-w-7xl px-4 sm:px-6">
        {/* Cabeçalho da Página com Ações Globais */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Contas Correntes & Tesouraria
                </h1>
                <p className="text-xs text-muted-foreground">
                  Gestão organizada por tipo: Bancos, Fornecedores de Metal, Clientes e Empréstimos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Toggle de Moeda */}
            <Tabs
              value={currencyMode}
              onValueChange={(v) => setCurrencyMode(v as "BRL" | "GOLD")}
              className="h-9"
            >
              <TabsList className="h-9">
                <TabsTrigger value="BRL" className="text-xs px-3">
                  R$ (Reais)
                </TabsTrigger>
                <TabsTrigger value="GOLD" className="text-xs px-3">
                  Au (Ouro)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Checkbox Inativas */}
            <div className="flex items-center space-x-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
              <Checkbox
                id="showInactive"
                checked={showInactive}
                onCheckedChange={(checked) => setShowInactive(!!checked)}
              />
              <Label
                htmlFor="showInactive"
                className="text-xs cursor-pointer text-muted-foreground select-none"
              >
                Mostrar Inativas
              </Label>
            </div>

            {/* Botão Nova Conta */}
            <Button onClick={handleOpenNewModal} className="h-9 gap-1.5 text-xs font-semibold">
              <PlusCircle className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Abas por Categoria / Tipo de Conta */}
        <Tabs value={filterType} onValueChange={setFilterType} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1.5 bg-muted/40 border border-border/50 rounded-2xl gap-1">
            <TabsTrigger
              value="BANCO"
              className="flex items-center gap-2 py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Landmark className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-xs sm:text-sm">Bancos & Caixas</span>
            </TabsTrigger>
            <TabsTrigger
              value="FORNECEDOR_METAL"
              className="flex items-center gap-2 py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Factory className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-xs sm:text-sm">Fornecedores Metal</span>
            </TabsTrigger>
            <TabsTrigger
              value="CLIENTE"
              className="flex items-center gap-2 py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-xs sm:text-sm">Clientes</span>
            </TabsTrigger>
            <TabsTrigger
              value="EMPRESTIMO"
              className="flex items-center gap-2 py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <HandCoins className="h-4 w-4 text-purple-500" />
              <span className="font-medium text-xs sm:text-sm">Empréstimos</span>
            </TabsTrigger>
            <TabsTrigger
              value="ALL"
              className="flex items-center gap-2 py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all col-span-2 sm:col-span-1"
            >
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-xs sm:text-sm">Todas as Contas</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Cards de Resumo & Seletor Rápido de Extrato */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Saldo Consolidado */}
          <Card className="bg-gradient-to-br from-card to-muted/20 border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Saldo Total ({currentTab.label})
                </span>
                <div
                  className={`text-xl font-bold tracking-tight ${
                    (currencyMode === "BRL" ? totalBRL : totalGold) < 0
                      ? "text-red-500"
                      : "text-foreground"
                  }`}
                >
                  {currencyMode === "BRL" ? formatCurrency(totalBRL) : formatGold(totalGold)}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {currencyMode === "BRL"
                    ? `≈ ${formatGold(totalGold)} em metal`
                    : `≈ ${formatCurrency(totalBRL)} em reais`}
                </span>
              </div>
              <div className={`p-3 rounded-2xl bg-muted/60 ${currentTab.color}`}>
                <TabIcon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Informações da Categoria */}
          <Card className="bg-gradient-to-br from-card to-muted/20 border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Contas Cadastradas
                </span>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  {contas.length} {contas.length === 1 ? "conta" : "contas"}
                </div>
                <span className="text-[11px] text-emerald-500 font-medium">
                  {activeCount} ativas no sistema
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-muted/60 text-muted-foreground">
                <Building2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Seletor Rápido de Extrato (Pedido pelo Usuário) */}
          <Card className="bg-gradient-to-br from-card to-muted/20 border-border/60 shadow-sm flex flex-col justify-center">
            <CardContent className="p-4 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Ir Direto ao Extrato
              </span>
              <div className="flex gap-2">
                <Select
                  onValueChange={(contaId) => {
                    if (contaId) {
                      router.push(`/contas-correntes/${contaId}/extrato?mode=${currencyMode}`);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder={`Selecionar ${currentTab.label.split(" ")[0]}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhuma conta nesta categoria
                      </SelectItem>
                    ) : (
                      contas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome} {c.agencia ? `(Ag. ${c.agencia})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Contas Correntes da Categoria */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="py-4 px-6 border-b border-border/40">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TabIcon className={`h-4 w-4 ${currentTab.color}`} />
                  {currentTab.label}
                </CardTitle>
                <CardDescription className="text-xs">
                  {currentTab.desc}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {contas.length} {contas.length === 1 ? "registro" : "registros"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {isFetching ? (
              <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Carregando contas...</span>
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <DataTable
                    columns={columns}
                    data={contas}
                    filterColumnId="nome"
                    filterPlaceholder={`Pesquisar em ${currentTab.label}...`}
                  />
                </div>

                <div className="md:hidden space-y-2 max-w-md mx-auto">
                  {contas.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground italic text-sm">
                      Nenhuma conta encontrada nesta categoria.
                    </div>
                  ) : (
                    contas.map((conta) => {
                      const val =
                        currencyMode === "BRL"
                          ? conta.saldoAtualBRL
                          : conta.saldoAtualGold;
                      const formatted =
                        currencyMode === "BRL"
                          ? formatCurrency(val)
                          : formatGold(val);
                      const isNegative = val < 0;

                      return (
                        <div
                          key={conta.id}
                          className="p-3.5 rounded-xl border border-border bg-card shadow-sm space-y-2.5 active:scale-[0.98] transition-transform"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {conta.type || "CONTA"}
                              </span>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/contas-correntes/${conta.id}/extrato?mode=${currencyMode}`}
                                  className="font-bold text-sm text-foreground line-clamp-1 hover:underline"
                                >
                                  {conta.nome}
                                </Link>
                                {!conta.isActive && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] px-1 py-0 h-4"
                                  >
                                    Inativa
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5"
                            >
                              #{conta.numeroConta}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                Saldo Atual ({currencyMode})
                              </span>
                              <span
                                className={
                                  isNegative
                                    ? "text-sm font-black text-red-500"
                                    : "text-sm font-black text-foreground"
                                }
                              >
                                {formatted}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <Link
                                    href={`/contas-correntes/${conta.id}/extrato?mode=${currencyMode}`}
                                  >
                                    <DropdownMenuItem>
                                      <FileText className="mr-2 h-4 w-4" /> Ver Extrato
                                    </DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuItem
                                    onClick={() => setContaForLancamento(conta)}
                                  >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Novo Lançamento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEditModal(conta)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setContaToDelete(conta)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Criação / Edição de Conta */}
      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={contaToEdit ? "Editar Conta" : "Nova Conta"}
        description="Preencha os detalhes da sua conta corrente, caixa ou carteira."
      >
        <ContaCorrenteForm
          conta={
            contaToEdit
              ? {
                  ...contaToEdit,
                  initialBalanceBRL: (contaToEdit as any).initialBalanceBRL ?? 0,
                  initialBalanceGold: (contaToEdit as any).initialBalanceGold ?? 0,
                  limite: (contaToEdit as any).limite ?? null,
                  type: (contaToEdit as any).type ?? null,
                }
              : filterType !== "ALL"
              ? ({
                  id: "",
                  nome: "",
                  numeroConta: "",
                  agencia: "",
                  initialBalanceBRL: 0,
                  initialBalanceGold: 0,
                  limite: 0,
                  type: filterType as any,
                  isActive: true,
                } as any)
              : null
          }
          onSave={handleSave}
        />
      </ResponsiveDialog>

      {/* Modal de Exclusão */}
      <Dialog
        open={!!contaToDelete}
        onOpenChange={(open) => {
          if (!open) setContaToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta "{contaToDelete?.nome}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Lançamento Rápido */}
      <Dialog
        open={!!contaForLancamento}
        onOpenChange={() => setContaForLancamento(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Novo Lançamento em {contaForLancamento?.nome}
            </DialogTitle>
          </DialogHeader>
          <TransacaoForm
            contaCorrenteId={contaForLancamento?.id || ""}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
