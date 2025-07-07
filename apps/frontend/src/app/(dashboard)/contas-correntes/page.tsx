"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { ContaCorrenteForm } from "./conta-corrente-form";

interface ContaCorrente {
  id: string;
  nome: string;
  numeroConta: string;
  agencia?: string;
  saldo: number;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

export default function ContasCorrentesPage() {
  const { user, loading } = useAuth();
  const [contas, setContas] = useState<ContaCorrente[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState<ContaCorrente | null>(null);
  const [contaToDelete, setContaToDelete] = useState<ContaCorrente | null>(
    null
  );

  const fetchContas = async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/contas-correntes");
      setContas(
        response.data.map((c: any) => ({ ...c, saldo: parseFloat(c.saldo) }))
      );
    } catch (err) {
      toast.error("Falha ao carregar contas.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !loading) fetchContas();
  }, [user, loading]);

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchContas();
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

  const handleOpenNewModal = () => {
    setContaToEdit(null);
    setIsFormModalOpen(true);
  };
  const handleOpenEditModal = (conta: ContaCorrente) => {
    setContaToEdit(conta);
    setIsFormModalOpen(true);
  };

  const columns: ColumnDef<ContaCorrente>[] = [
    { accessorKey: "nome", header: "Nome da Conta" },
    { accessorKey: "numeroConta", header: "Número / ID" },
    { accessorKey: "agencia", header: "Agência" },
    {
      accessorKey: "saldo",
      header: "Saldo Atual",
      cell: ({ row }) => formatCurrency(row.getValue("saldo")),
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
              <DropdownMenuItem onClick={() => handleOpenEditModal(conta)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
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

  if (loading) return <p className="text-center p-10">Carregando...</p>;

  return (
    <>
      <Card className="mx-auto my-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Contas Correntes (Caixa e Bancos)</CardTitle>
            <Button onClick={handleOpenNewModal}>Nova Conta</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p>Buscando contas...</p>
          ) : (
            <DataTable columns={columns} data={contas} filterColumnId="nome" />
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={contaToEdit ? "Editar Conta" : "Nova Conta"}
        description="Preencha os detalhes da sua conta corrente, caixa ou carteira."
      >
        <ContaCorrenteForm conta={contaToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog open={!!contaToDelete} onOpenChange={setContaToDelete}>
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
    </>
  );
}
