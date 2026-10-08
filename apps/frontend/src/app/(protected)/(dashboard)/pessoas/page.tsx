"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal, Upload, History, CheckCircle2, AlertTriangle, FileText, Trash2, Edit } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PessoaForm } from "./pessoa-form";

interface Pessoa {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  client: object | null;
  fornecedor: object | null;
  funcionario: object | null;
}

type Role = 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO';

interface RecentRecordItem {
  id: string;
  type: string;
  title: string;
  date: string;
  value?: number;
  status?: string;
}

interface PessoaHistoryResponse {
  pessoaId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  totalRecords: number;
  counts: {
    sales: number;
    purchaseOrders: number;
    accountsPayable: number;
    transacoes: number;
    analisesQuimicas: number;
    ordensRecuperacao: number;
    creditosMetal: number;
  };
  recentRecords: RecentRecordItem[];
}

export default function PessoasPage() {
  const { user, isLoading } = useAuth();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [pessoaToEdit, setPessoaToEdit] = useState<Pessoa | null>(null);
  const [pessoaToDelete, setPessoaToDelete] = useState<Pessoa | null>(null);

  // Modal de Histórico/Lançamentos
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPessoa, setHistoryPessoa] = useState<Pessoa | null>(null);
  const [historyData, setHistoryData] = useState<PessoaHistoryResponse | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchPessoas = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get("/pessoas", {
        params: { role: roleFilter },
      });
      setPessoas(response.data);
    } catch (err) {
      toast.error("Falha ao buscar pessoas.");
    }
  }, [user, roleFilter]);

  useEffect(() => {
    fetchPessoas();
  }, [fetchPessoas]);

  const handleOpenNewModal = () => {
    setPessoaToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (pessoa: Pessoa) => {
    setPessoaToEdit(pessoa);
    setIsFormModalOpen(true);
  };

  const handleOpenHistoryModal = async (pessoa: Pessoa) => {
    setHistoryPessoa(pessoa);
    setHistoryData(null);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const response = await api.get(`/pessoas/${pessoa.id}/history`);
      setHistoryData(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao carregar lançamentos da pessoa.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchPessoas();
  };

  const handleDelete = async () => {
    if (!pessoaToDelete) return;
    try {
      await api.delete(`/pessoas/${pessoaToDelete.id}`);
      toast.success("Pessoa removida com sucesso!");
      setPessoaToDelete(null);
      fetchPessoas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao remover pessoa.");
      setPessoaToDelete(null);
    }
  };

  const columns: ColumnDef<Pessoa>[] = [
    { accessorKey: "name", header: "Nome" },
    { 
      accessorKey: "email", 
      header: "Email",
      cell: ({ row }) => row.original.email || "-"
    },
    { 
      accessorKey: "phone", 
      header: "Telefone",
      cell: ({ row }) => row.original.phone || "-"
    },
    {
      id: "roles",
      header: "Papéis",
      cell: ({ row }) => {
        const pessoa = row.original;
        const roles = [];
        if (pessoa.client) roles.push({ label: "Cliente", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800" });
        if (pessoa.fornecedor) roles.push({ label: "Fornecedor", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800" });
        if (pessoa.funcionario) roles.push({ label: "Funcionário", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800" });
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role.label} variant="outline" className={`${role.color} border`}>
                {role.label}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const pessoa = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenHistoryModal(pessoa)}>
                <History className="mr-2 h-4 w-4 text-blue-500" />
                Ver Lançamentos / Vínculos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEditModal(pessoa)}>
                <Edit className="mr-2 h-4 w-4 text-amber-500" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setPessoaToDelete(pessoa)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) return <p className="text-center p-10">Carregando...</p>;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Pessoas</h1>
        <div className="flex items-center space-x-2">
          <Link href="/pessoas/import" passHref>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
          </Link>
          <Button onClick={handleOpenNewModal}>Nova Pessoa</Button>
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          variant={roleFilter === null ? "default" : "outline"}
          onClick={() => setRoleFilter(null)}
        >
          Todos
        </Button>
        <Button
          variant={roleFilter === "CLIENT" ? "default" : "outline"}
          onClick={() => setRoleFilter("CLIENT")}
        >
          Clientes
        </Button>
        <Button
          variant={roleFilter === "FORNECEDOR" ? "default" : "outline"}
          onClick={() => setRoleFilter("FORNECEDOR")}
        >
          Fornecedores
        </Button>
        <Button
          variant={roleFilter === "FUNCIONARIO" ? "default" : "outline"}
          onClick={() => setRoleFilter("FUNCIONARIO")}
        >
          Funcionários
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <DataTable columns={columns} data={pessoas} filterColumnId="name" />
          </div>
        </CardContent>
      </Card>

      {/* Modal Formulário (Criar / Editar) */}
      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={pessoaToEdit ? "Editar Pessoa" : "Nova Pessoa"}
        description="Preencha os detalhes da pessoa aqui."
        className="sm:max-w-3xl"
      >
        <PessoaForm initialData={pessoaToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      {/* Modal Ver Lançamentos / Vínculos */}
      <Dialog
        open={isHistoryModalOpen}
        onOpenChange={(isOpen) => !isOpen && setIsHistoryModalOpen(false)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Lançamentos & Vínculos de {historyPessoa?.name}
            </DialogTitle>
            <DialogDescription>
              Resumo do histórico cadastral e transações vinculadas a esta pessoa.
            </DialogDescription>
          </DialogHeader>

          {isLoadingHistory ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando lançamentos...
            </div>
          ) : historyData ? (
            <div className="space-y-4 py-2">
              {/* Box de Status de Exclusão */}
              {historyData.totalRecords === 0 ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-emerald-400">
                      Nenhum lançamento vinculado
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Esta pessoa não possui nenhuma venda, conta ou transação registrada no sistema. **É 100% seguro excluí-la!**
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-amber-400">
                      Possui {historyData.totalRecords} vínculo(s) no sistema
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Para conseguir excluir esta pessoa, os registros vinculados (vendas, contas a pagar/receber) precisam ser excluídos ou alterados antes.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid de Resumo de Registros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-muted/40 rounded border flex flex-col justify-between">
                  <span className="text-muted-foreground font-medium">Vendas</span>
                  <span className="text-lg font-bold mt-1">{historyData.counts.sales}</span>
                </div>
                <div className="p-2.5 bg-muted/40 rounded border flex flex-col justify-between">
                  <span className="text-muted-foreground font-medium">Compras</span>
                  <span className="text-lg font-bold mt-1">{historyData.counts.purchaseOrders}</span>
                </div>
                <div className="p-2.5 bg-muted/40 rounded border flex flex-col justify-between">
                  <span className="text-muted-foreground font-medium">Contas a Pagar</span>
                  <span className="text-lg font-bold mt-1">{historyData.counts.accountsPayable}</span>
                </div>
                <div className="p-2.5 bg-muted/40 rounded border flex flex-col justify-between">
                  <span className="text-muted-foreground font-medium">Transações</span>
                  <span className="text-lg font-bold mt-1">{historyData.counts.transacoes}</span>
                </div>
                <div className="p-2.5 bg-muted/40 rounded border flex flex-col justify-between">
                  <span className="text-muted-foreground font-medium">Análises Químicas</span>
                  <span className="text-lg font-bold mt-1">{historyData.counts.analisesQuimicas}</span>
                </div>
                <div className="p-2.5 bg-muted/40 rounded border flex flex-col justify-between">
                  <span className="text-muted-foreground font-medium">Ordens Recuperação</span>
                  <span className="text-lg font-bold mt-1">{historyData.counts.ordensRecuperacao}</span>
                </div>
                <div className="p-2.5 bg-muted/40 rounded border flex flex-col justify-between">
                  <span className="text-muted-foreground font-medium">Créditos Metal</span>
                  <span className="text-lg font-bold mt-1">{historyData.counts.creditosMetal}</span>
                </div>
                <div className="p-2.5 bg-primary/10 border border-primary/20 rounded flex flex-col justify-between">
                  <span className="text-primary font-medium">Total Geral</span>
                  <span className="text-lg font-bold mt-1 text-primary">{historyData.totalRecords}</span>
                </div>
              </div>

              {/* Lista de Últimos Lançamentos */}
              {historyData.recentRecords.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Últimos Registros Encontrados
                  </h4>
                  <div className="border rounded-md divide-y text-xs max-h-48 overflow-y-auto">
                    {historyData.recentRecords.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="p-2.5 flex items-center justify-between hover:bg-muted/30">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(item.date).toLocaleDateString('pt-BR')} • {item.type}
                          </p>
                        </div>
                        <div className="text-right">
                          {item.value !== undefined && (
                            <p className="font-semibold">
                              R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          {item.status && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {item.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="flex justify-between items-center sm:justify-between">
            {historyData && historyData.totalRecords === 0 && historyPessoa && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setPessoaToDelete(historyPessoa);
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Excluir Cadastro sem Lançamentos
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog
        open={!!pessoaToDelete}
        onOpenChange={(isOpen) => !isOpen && setPessoaToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar "{pessoaToDelete?.name}"? Esta ação
              não pode ser desfeita.
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
    </>
  );
}
