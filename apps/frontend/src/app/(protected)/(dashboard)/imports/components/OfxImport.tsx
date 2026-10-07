"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { ContaContabilForm } from "@/components/forms/conta-contabil-form";
import { TipoContaContabilPrisma } from "@/lib/types";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronsUpDown,
  ArrowRightLeft,
  Tag,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Wallet,
  CheckCheck,
  RotateCcw,
} from "lucide-react";

// Interfaces
interface ContaCorrente {
  id: string;
  nome: string;
}
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}
interface PreviewTransaction {
  fitId: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string;
  postedAt: string;
  status: "new" | "duplicate";
  suggestedContaContabilId?: string;
  goldPrice?: number | null;
  goldAmount?: number | null;
}
interface SelectionState {
  selected: boolean;
  contaContabilId?: string;
  description?: string;
  isTransfer?: boolean;
  destinationContaCorrenteId?: string;
  goldPrice?: number | null;
  goldAmount?: number | null;
}

interface UserSettings {
  id: string;
  defaultReceitaContaId: string | null;
  defaultDespesaContaId: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  settings: UserSettings | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

/**
 * Combobox com campo de pesquisa do Shadcn para o Plano de Contas (Despesas / Receitas).
 */
function CategorySearchCombobox({
  accounts,
  value,
  onChange,
  onOpenCreateModal,
  disabled,
}: {
  accounts: ContaContabil[];
  value?: string;
  onChange: (value: string) => void;
  onOpenCreateModal: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === value),
    [accounts, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-8 text-xs font-normal px-2.5 truncate"
        >
          {selectedAccount ? (
            <span className="truncate flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                {selectedAccount.codigo}
              </span>
              <span className="truncate">{selectedAccount.nome}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Selecione uma categoria...</span>
          )}
          <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 z-[100]" align="start">
        <Command>
          <CommandInput
            placeholder="Pesquisar categoria (nome ou código)..."
            className="h-9 text-xs"
          />
          <CommandList className="max-h-[260px]">
            <CommandEmpty className="py-2.5 text-center text-xs text-muted-foreground">
              Nenhuma categoria encontrada.
            </CommandEmpty>
            <CommandGroup heading="Plano de Contas">
              {accounts.map((acc) => (
                <CommandItem
                  key={acc.id}
                  value={`${acc.codigo} ${acc.nome}`}
                  onSelect={() => {
                    onChange(acc.id);
                    setOpen(false);
                  }}
                  className="text-xs py-1.5"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 shrink-0",
                      value === acc.id ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground mr-1.5 shrink-0">
                    {acc.codigo}
                  </span>
                  <span className="truncate font-medium">{acc.nome}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onOpenCreateModal();
                }}
                className="text-xs text-primary font-semibold cursor-pointer py-1.5"
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                + Criar nova categoria...
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Combobox com campo de pesquisa do Shadcn para Contas Correntes (Transferências entre contas).
 */
function TransferAccountCombobox({
  accounts,
  currentAccountId,
  value,
  onChange,
  type,
  disabled,
}: {
  accounts: ContaCorrente[];
  currentAccountId: string;
  value?: string;
  onChange: (value: string) => void;
  type: "CREDIT" | "DEBIT";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const availableAccounts = useMemo(
    () => accounts.filter((a) => a.id !== currentAccountId),
    [accounts, currentAccountId]
  );
  const selectedAccount = useMemo(
    () => availableAccounts.find((a) => a.id === value),
    [availableAccounts, value]
  );

  const placeholder =
    type === "DEBIT"
      ? "Transferir para qual conta?..."
      : "Transferência vinda de qual conta?...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-8 text-xs font-normal px-2.5 truncate border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30"
        >
          {selectedAccount ? (
            <span className="truncate flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-medium">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span className="truncate">
                {type === "DEBIT" ? "Para: " : "De: "}
                {selectedAccount.nome}
              </span>
            </span>
          ) : (
            <span className="text-blue-600 dark:text-blue-400 font-medium">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50 text-blue-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 z-[100]" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar conta bancária..." className="h-9 text-xs" />
          <CommandList className="max-h-[220px]">
            <CommandEmpty className="py-2.5 text-center text-xs text-muted-foreground">
              Nenhuma conta encontrada.
            </CommandEmpty>
            <CommandGroup heading={type === "DEBIT" ? "Conta de Destino" : "Conta de Origem"}>
              {availableAccounts.map((acc) => (
                <CommandItem
                  key={acc.id}
                  value={acc.nome}
                  onSelect={() => {
                    onChange(acc.id);
                    setOpen(false);
                  }}
                  className="text-xs py-1.5"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 shrink-0",
                      value === acc.id ? "opacity-100 text-blue-600" : "opacity-0"
                    )}
                  />
                  <Building2 className="w-3.5 h-3.5 mr-2 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">{acc.nome}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OfxImport() {
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [contasDeEntrada, setContasDeEntrada] = useState<ContaContabil[]>([]);
  const [contasDeSaida, setContasDeSaida] = useState<ContaContabil[]>([]);

  const [selectedContaCorrenteId, setSelectedContaCorrenteId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewTransaction[]>([]);
  const [selections, setSelections] = useState<Record<string, SelectionState>>({});

  // Filtro de exibição: Todas, Somente Créditos, Somente Débitos
  const [activeFilter, setActiveFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] =
    useState<TipoContaContabilPrisma>(TipoContaContabilPrisma.DESPESA);

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: () => api.get("/users/profile").then((res) => res.data),
  });

  const fetchContas = async () => {
    try {
      const [resReceitas, resDespesas] = await Promise.all([
        api.get("/contas-contabeis?tipo=RECEITA"),
        api.get("/contas-contabeis?tipo=DESPESA"),
      ]);
      setContasDeEntrada(resReceitas.data);
      setContasDeSaida(resDespesas.data);
    } catch {
      toast.error("Erro ao recarregar o plano de contas.");
    }
  };

  useEffect(() => {
    api.get("/contas-correntes").then((res) => setContasCorrentes(res.data));
    fetchContas();
  }, []);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContaCorrenteId || !selectedFile) {
      toast.error("Por favor, selecione a conta e um arquivo.");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("contaCorrenteId", selectedContaCorrenteId);

    try {
      const response = await api.post(
        "/bank-statement-imports/preview-ofx",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const newPreviewData: PreviewTransaction[] = response.data;
      setPreviewData(newPreviewData);

      const defaultReceitaId = userProfile?.settings?.defaultReceitaContaId;
      const defaultDespesaId = userProfile?.settings?.defaultDespesaContaId;

      const otherAccounts = contasCorrentes.filter(
        (c) => c.id !== selectedContaCorrenteId
      );

      const initialSelections = newPreviewData.reduce(
        (acc: Record<string, SelectionState>, t: PreviewTransaction) => {
          const searchDescription = t.description.toLowerCase();

          // Detecção automática de transferência (termos chave ou menção a outras contas)
          const isTransfKeyword =
            searchDescription.includes("electrosal") ||
            searchDescription.includes("transf") ||
            searchDescription.includes("transferencia") ||
            searchDescription.includes("transferência") ||
            searchDescription.includes("entre contas") ||
            searchDescription.includes("ted ") ||
            searchDescription.includes("doc ") ||
            searchDescription.includes("tef ");

          const matchedOtherAccount = otherAccounts.find((c) =>
            searchDescription.includes(c.nome.toLowerCase())
          );

          const autoIsTransfer = isTransfKeyword || !!matchedOtherAccount;

          let suggestedContaId: string | undefined = t.suggestedContaContabilId;

          if (!autoIsTransfer && t.status === "new" && !suggestedContaId) {
            const accountsToSearch =
              t.type === "CREDIT" ? contasDeEntrada : contasDeSaida;
            const defaultId =
              t.type === "CREDIT" ? defaultReceitaId : defaultDespesaId;

            const foundAccount = accountsToSearch.find((a) =>
              searchDescription.includes(a.nome.toLowerCase())
            );

            if (foundAccount) {
              suggestedContaId = foundAccount.id;
            } else if (defaultId) {
              suggestedContaId = defaultId;
            }
          }

          acc[t.fitId] = {
            selected: t.status === "new",
            contaContabilId: suggestedContaId,
            description: t.description,
            isTransfer: autoIsTransfer,
            destinationContaCorrenteId: matchedOtherAccount?.id || undefined,
            goldPrice: t.goldPrice,
            goldAmount: t.goldAmount,
          };
          return acc;
        },
        {}
      );
      setSelections(initialSelections);
      setActiveFilter("ALL");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Erro ao pré-visualizar arquivo."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectionChange = (
    fitId: string,
    key: keyof SelectionState,
    value: any,
    originalDescription: string
  ) => {
    const newSelections = { ...selections };
    if (key === "isTransfer" && value === true) {
      newSelections[fitId] = {
        ...newSelections[fitId],
        isTransfer: true,
        contaContabilId: undefined,
      };
    } else {
      newSelections[fitId] = { ...newSelections[fitId], [key]: value };
    }

    // Propaga automaticamente para transações idênticas
    if (
      (key === "contaContabilId" ||
        key === "isTransfer" ||
        key === "destinationContaCorrenteId") &&
      originalDescription
    ) {
      previewData.forEach((t) => {
        if (t.description === originalDescription && t.fitId !== fitId) {
          if (key === "isTransfer" && value === true) {
            newSelections[t.fitId] = {
              ...newSelections[t.fitId],
              isTransfer: true,
              contaContabilId: undefined,
            };
          } else {
            newSelections[t.fitId] = {
              ...newSelections[t.fitId],
              [key]: value,
            };
          }
        }
      });
    }
    setSelections(newSelections);
  };

  // Filtragem de dados pela aba selecionada
  const filteredPreviewData = useMemo(() => {
    if (activeFilter === "CREDIT") {
      return previewData.filter((t) => t.type === "CREDIT");
    }
    if (activeFilter === "DEBIT") {
      return previewData.filter((t) => t.type === "DEBIT");
    }
    return previewData;
  }, [previewData, activeFilter]);

  const totalCreditsCount = useMemo(
    () => previewData.filter((t) => t.type === "CREDIT").length,
    [previewData]
  );
  const totalDebitsCount = useMemo(
    () => previewData.filter((t) => t.type === "DEBIT").length,
    [previewData]
  );

  // Contadores e totais dos itens selecionados
  const selectedStats = useMemo(() => {
    let count = 0;
    let totalDebits = 0;
    let totalCredits = 0;
    let totalDebitsGold = 0;
    let totalCreditsGold = 0;

    previewData.forEach((t) => {
      if (selections[t.fitId]?.selected) {
        count++;
        const gAmount =
          t.goldAmount ||
          (t.goldPrice && t.goldPrice > 0 ? t.amount / t.goldPrice : 0);

        if (t.type === "DEBIT") {
          totalDebits += t.amount;
          totalDebitsGold += gAmount;
        } else {
          totalCredits += t.amount;
          totalCreditsGold += gAmount;
        }
      }
    });

    return {
      count,
      totalDebits,
      totalCredits,
      totalDebitsGold,
      totalCreditsGold,
      net: totalCredits - totalDebits,
      netGold: totalCreditsGold - totalDebitsGold,
    };
  }, [previewData, selections]);

  // Contadores para o checkbox mestre da lista visível filtrada
  const selectableFilteredCount = useMemo(
    () => filteredPreviewData.filter((t) => t.status === "new").length,
    [filteredPreviewData]
  );
  const selectedFilteredCount = useMemo(
    () =>
      filteredPreviewData.filter(
        (t) => t.status === "new" && selections[t.fitId]?.selected
      ).length,
    [filteredPreviewData, selections]
  );

  const handleToggleSelectFiltered = (checked: boolean) => {
    const newSelections = { ...selections };
    filteredPreviewData.forEach((t) => {
      if (t.status === "new") {
        newSelections[t.fitId] = {
          ...newSelections[t.fitId],
          selected: checked,
        };
      }
    });
    setSelections(newSelections);
  };

  const handleSelectOnlyDebits = () => {
    const newSelections = { ...selections };
    previewData.forEach((t) => {
      if (t.status === "new") {
        newSelections[t.fitId] = {
          ...newSelections[t.fitId],
          selected: t.type === "DEBIT",
        };
      }
    });
    setSelections(newSelections);
    setActiveFilter("DEBIT");
    toast.info("Apenas débitos selecionados.");
  };

  const handleSelectOnlyCredits = () => {
    const newSelections = { ...selections };
    previewData.forEach((t) => {
      if (t.status === "new") {
        newSelections[t.fitId] = {
          ...newSelections[t.fitId],
          selected: t.type === "CREDIT",
        };
      }
    });
    setSelections(newSelections);
    setActiveFilter("CREDIT");
    toast.info("Apenas créditos selecionados.");
  };

  const handleClearSelection = () => {
    const newSelections = { ...selections };
    previewData.forEach((t) => {
      if (newSelections[t.fitId]) {
        newSelections[t.fitId] = {
          ...newSelections[t.fitId],
          selected: false,
        };
      }
    });
    setSelections(newSelections);
  };

  const handleFinalImport = async () => {
    const selectedTransactions = previewData.filter(
      (t) => selections[t.fitId]?.selected
    );

    if (selectedTransactions.length === 0) {
      toast.info("Nenhuma nova transação selecionada para importar.");
      return;
    }

    // Validações antes do envio
    for (const t of selectedTransactions) {
      const sel = selections[t.fitId];
      if (sel?.isTransfer) {
        if (!sel.destinationContaCorrenteId) {
          toast.error(
            `A transferência "${sel.description || t.description}" precisa de uma conta bancária de destino/origem.`
          );
          return;
        }
        if (sel.destinationContaCorrenteId === selectedContaCorrenteId) {
          toast.error(
            `A transferência "${sel.description || t.description}" não pode transferir para a mesma conta corrente.`
          );
          return;
        }
      } else {
        if (!sel?.contaContabilId) {
          toast.error(
            `A transação "${sel?.description || t.description}" precisa de uma categoria no plano de contas.`
          );
          return;
        }
      }
    }

    setIsUploading(true);
    const transactionsToImport = selectedTransactions.map((t) => {
      const sel = selections[t.fitId];
      return {
        fitId: t.fitId,
        amount: t.amount,
        description: sel?.description ?? t.description,
        postedAt: new Date(t.postedAt),
        tipo: t.type === "CREDIT" ? "CREDITO" : "DEBITO",
        contaContabilId: sel?.isTransfer
          ? undefined
          : sel?.contaContabilId,
        isTransfer: !!sel?.isTransfer,
        destinationContaCorrenteId: sel?.isTransfer
          ? sel.destinationContaCorrenteId
          : undefined,
        goldPrice: sel?.goldPrice ?? t.goldPrice ?? undefined,
        goldAmount: sel?.goldAmount ?? t.goldAmount ?? undefined,
      };
    });

    const payload = {
      contaCorrenteId: selectedContaCorrenteId,
      transactions: transactionsToImport,
    };

    try {
      const response = await api.post("/transacoes/bulk-create", payload);
      toast.success(
        `${response.data.count} transação(ões) processada(s) e importada(s) com sucesso!`
      );
      setPreviewData([]);
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Erro ao importar transações."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const openNewCategoryModal = (type: "CREDIT" | "DEBIT") => {
    setNewCategoryType(
      type === "CREDIT"
        ? TipoContaContabilPrisma.RECEITA
        : TipoContaContabilPrisma.DESPESA
    );
    setIsCategoryModalOpen(true);
  };

  if (previewData.length === 0) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Importar Extrato Bancário (.ofx)</CardTitle>
          <CardDescription>
            Selecione a conta de destino e o arquivo OFX para conciliar as
            transações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="space-y-2">
              <Label>Importar Para Qual Conta Corrente?</Label>
              <Select
                value={selectedContaCorrenteId}
                onValueChange={setSelectedContaCorrenteId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta..." />
                </SelectTrigger>
                <SelectContent>
                  {contasCorrentes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ofx-file">Arquivo .ofx</Label>
              <Input
                id="ofx-file"
                type="file"
                accept=".ofx, .OFX"
                onChange={(e) =>
                  setSelectedFile(e.target.files ? e.target.files[0] : null)
                }
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isUploading || isLoadingProfile}
              className="w-full"
            >
              {isUploading ? "Analisando..." : "Analisar Arquivo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mx-auto my-6 max-w-6xl shadow-md border-border/80">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" /> Conciliação Bancária OFX
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Categorize como despesa/receita ou defina como transferência entre contas bancárias.
              </CardDescription>
            </div>

            {/* Resumo financeiro rápido */}
            <div className="flex flex-wrap items-center gap-2 text-xs bg-muted/50 p-2 rounded-lg border">
              <span className="text-muted-foreground font-medium">Selecionados:</span>
              <Badge variant="outline" className="font-semibold text-foreground">
                {selectedStats.count} itens
              </Badge>
              {selectedStats.totalDebits > 0 && (
                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50/50 flex items-center gap-1.5">
                  <span>Saídas: - {formatCurrency(selectedStats.totalDebits)}</span>
                  {selectedStats.totalDebitsGold > 0 && (
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold border-l pl-1.5 border-rose-300">
                      - {selectedStats.totalDebitsGold.toFixed(4)} g Au
                    </span>
                  )}
                </Badge>
              )}
              {selectedStats.totalCredits > 0 && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/50 flex items-center gap-1.5">
                  <span>Entradas: + {formatCurrency(selectedStats.totalCredits)}</span>
                  {selectedStats.totalCreditsGold > 0 && (
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold border-l pl-1.5 border-emerald-300">
                      + {selectedStats.totalCreditsGold.toFixed(4)} g Au
                    </span>
                  )}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Barra de Filtros e Seleção Rápida */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-muted/20 rounded-lg border">
            {/* Tabs para filtrar Débito / Crédito */}
            <Tabs
              value={activeFilter}
              onValueChange={(v) => setActiveFilter(v as any)}
              className="w-full lg:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full lg:w-auto h-9">
                <TabsTrigger value="ALL" className="text-xs">
                  Todas ({previewData.length})
                </TabsTrigger>
                <TabsTrigger
                  value="CREDIT"
                  className="text-xs text-emerald-600 data-[state=active]:text-emerald-700 font-medium"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 mr-1" />
                  Créditos ({totalCreditsCount})
                </TabsTrigger>
                <TabsTrigger
                  value="DEBIT"
                  className="text-xs text-rose-600 data-[state=active]:text-rose-700 font-medium"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  Débitos ({totalDebitsCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Ações rápidas de seleção */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium text-[11px] mr-1">
                Ações de Seleção:
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5"
                onClick={() => handleToggleSelectFiltered(true)}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1 text-primary" />
                Marcar Todos
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={handleSelectOnlyDebits}
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                Apenas Débitos
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={handleSelectOnlyCredits}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 mr-1" />
                Apenas Créditos
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2 text-muted-foreground"
                onClick={handleClearSelection}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Tabela de Transações */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[48px]">
                    <Checkbox
                      checked={
                        selectableFilteredCount > 0 &&
                        selectedFilteredCount === selectableFilteredCount
                          ? true
                          : selectedFilteredCount > 0
                          ? "indeterminate"
                          : false
                      }
                      onCheckedChange={(checked) =>
                        handleToggleSelectFiltered(!!checked)
                      }
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead className="min-w-[200px]">Descrição (Editável)</TableHead>
                  <TableHead className="w-[340px]">Classificação / Destino</TableHead>
                  <TableHead className="w-[160px] text-right">Valor (R$) / Au (g)</TableHead>
                  <TableHead className="w-[90px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPreviewData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma transação encontrada para o filtro selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPreviewData.map((t) => {
                    const sel = selections[t.fitId] || { selected: false };
                    const isTransfer = !!sel.isTransfer;
                    const contasParaEsteItem =
                      t.type === "CREDIT" ? contasDeEntrada : contasDeSaida;

                    return (
                      <TableRow
                        key={t.fitId}
                        className={cn(
                          t.status === "duplicate" ? "bg-muted/30 opacity-75" : "",
                          sel.selected ? "bg-primary/5" : ""
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={sel.selected || false}
                            disabled={t.status === "duplicate"}
                            onCheckedChange={(checked) =>
                              handleSelectionChange(
                                t.fitId,
                                "selected",
                                !!checked,
                                t.description
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatDate(t.postedAt)}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            defaultValue={t.description}
                            onBlur={(e) =>
                              handleSelectionChange(
                                t.fitId,
                                "description",
                                e.target.value,
                                t.description
                              )
                            }
                            className="w-full h-8 text-xs font-medium"
                            disabled={t.status === "duplicate"}
                          />
                        </TableCell>
                        <TableCell>
                          {t.status === "new" && (
                            <div className="space-y-1.5">
                              {/* Seletor Categoria vs Transferência */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectionChange(
                                      t.fitId,
                                      "isTransfer",
                                      false,
                                      t.description
                                    )
                                  }
                                  className={cn(
                                    "px-2 py-0.5 text-[11px] rounded transition-all font-medium flex items-center gap-1 cursor-pointer",
                                    !isTransfer
                                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                                      : "text-muted-foreground hover:bg-muted/80 bg-muted/40"
                                  )}
                                >
                                  <Tag className="w-2.5 h-2.5" /> Categoria
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectionChange(
                                      t.fitId,
                                      "isTransfer",
                                      true,
                                      t.description
                                    )
                                  }
                                  className={cn(
                                    "px-2 py-0.5 text-[11px] rounded transition-all font-medium flex items-center gap-1 cursor-pointer",
                                    isTransfer
                                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                                      : "text-muted-foreground hover:bg-muted/80 bg-muted/40"
                                  )}
                                >
                                  <ArrowRightLeft className="w-2.5 h-2.5" /> Transferência
                                </button>
                              </div>

                              {/* Campo de pesquisa de acordo com a modalidade */}
                              {isTransfer ? (
                                <TransferAccountCombobox
                                  accounts={contasCorrentes}
                                  currentAccountId={selectedContaCorrenteId}
                                  value={sel.destinationContaCorrenteId}
                                  type={t.type}
                                  onChange={(val) =>
                                    handleSelectionChange(
                                      t.fitId,
                                      "destinationContaCorrenteId",
                                      val,
                                      t.description
                                    )
                                  }
                                />
                              ) : (
                                <CategorySearchCombobox
                                  accounts={contasParaEsteItem}
                                  value={sel.contaContabilId}
                                  onChange={(val) =>
                                    handleSelectionChange(
                                      t.fitId,
                                      "contaContabilId",
                                      val,
                                      t.description
                                    )
                                  }
                                  onOpenCreateModal={() => openNewCategoryModal(t.type)}
                                />
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div
                            className={cn(
                              "font-bold text-xs",
                              t.type === "CREDIT"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {t.type === "CREDIT" ? "+ " : "- "}
                            {formatCurrency(Math.abs(t.amount))}
                          </div>
                          {t.goldPrice ? (
                            <div
                              className="text-[11px] font-mono text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1 mt-0.5"
                              title={`Cotação Au: ${formatCurrency(t.goldPrice)}/g`}
                            >
                              <span className="font-semibold">
                                {t.type === "CREDIT" ? "+ " : "- "}
                                {Number(
                                  t.goldAmount ||
                                    (t.goldPrice > 0 ? t.amount / t.goldPrice : 0)
                                ).toFixed(4)}{" "}
                                g
                              </span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                (@{formatCurrency(t.goldPrice)})
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                              Sem cotação ref.
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={t.status === "new" ? "default" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {t.status === "new" ? "Novo" : "Já existe"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Rodapé e Botão de Importação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              Mostrando <span className="font-semibold text-foreground">{filteredPreviewData.length}</span> de{" "}
              <span className="font-semibold text-foreground">{previewData.length}</span> transações
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewData([])}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleFinalImport}
                disabled={isUploading || selectedStats.count === 0}
                className="gap-2"
              >
                {isUploading
                  ? "Importando..."
                  : `Importar (${selectedStats.count}) Selecionadas`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Conta Contábil</DialogTitle>
          </DialogHeader>
          <ContaContabilForm
            initialData={{ nome: "", tipo: newCategoryType, contaPaiId: null }}
            onSave={() => {
              setIsCategoryModalOpen(false);
              fetchContas();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}