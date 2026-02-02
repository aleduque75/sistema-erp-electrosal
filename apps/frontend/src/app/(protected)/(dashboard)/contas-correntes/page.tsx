"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

const CONTA_CORRENTE_TYPES = ["BANCO", "FORNECEDOR_METAL", "EMPRESTIMO", "CLIENTE"];

export default function ContasCorrentesPage() {
  const { user, isLoading } = useAuth();
  const [contas, setContas] = useState<ContaCorrente[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [currencyMode, setCurrencyMode] = useState<"BRL" | "GOLD">("BRL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showInactive, setShowInactive] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState<ContaCorrente | null>(null);
  const [contaToDelete, setContaToDelete] = useState<ContaCorrente | null>(
    null
  );
  const [contaForLancamento, setContaForLancamento] =
    useState<ContaCorrente | null>(null);

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

  const columns: ColumnDef<ContaCorrente>[] = [
    { 
      accessorKey: "nome", 
      header: "Nome da Conta",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.nome}
          {!row.original.isActive && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-400">
              Inativa
            </span>
          )}
        </div>
      )
    },
    { accessorKey: "numeroConta", header: "Número / ID" },
    { accessorKey: "agencia", header: "Agência" },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => row.original.type || "-",
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
          <span className={isNegative ? "text-red-600 font-bold" : "text-foreground font-medium"}>
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

  if (isLoading) return <p className="text-center p-10 text-foreground">Carregando...</p>;
  if (!user)
    return <p className="text-center p-10 text-foreground">Faça login para continuar.</p>;

  return (
    <>
      <Card className="mx-auto my-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Contas Correntes (Caixa e Bancos)</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showInactive" 
                  checked={showInactive} 
                  onCheckedChange={(checked) => setShowInactive(!!checked)} 
                />
                <Label htmlFor="showInactive" className="text-sm cursor-pointer text-foreground">Mostrar Inativas</Label>
              </div>

              <div className="w-[200px]">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os Tipos</SelectItem>
                    {CONTA_CORRENTE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs
                value={currencyMode}
                onValueChange={(v) => setCurrencyMode(v as "BRL" | "GOLD")}
              >
                <TabsList>
                  <TabsTrigger value="BRL">R$ (Reais)</TabsTrigger>
                  <TabsTrigger value="GOLD">Au (Ouro)</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button onClick={handleOpenNewModal}>Nova Conta</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p className="text-center p-10 text-foreground">Buscando contas...</p>
          ) : (
            <DataTable
              columns={columns}
              data={contas}
              filterColumnId="nome"
              filterPlaceholder="Pesquisar por nome da conta..."
            />
          )}
        </CardContent>
      </Card>

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
                  saldoInicial:
                    (contaToEdit as any).saldoInicial ??
                    (contaToEdit as any).saldo ?? // Fallback antigo
                    0,
                  limite: (contaToEdit as any).limite ?? null,
                  type: (contaToEdit as any).type ?? null,
                }
              : null
          }
          onSave={handleSave}
        />
      </ResponsiveDialog>

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
