"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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
import { ContaContabilForm } from "./conta-contabil-form";

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
  contaPaiId?: string | null;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | boolean | null;
}) => {
  if (value === null || value === undefined) return null;
  const displayValue =
    typeof value === "boolean" ? (value ? "Sim" : "Não") : value;
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p>{displayValue}</p>
    </div>
  );
};

export default function ContasContabeisPage() {
  const { user, loading } = useAuth();
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState<ContaContabil | null>(null);
  const [contaToDelete, setContaToDelete] = useState<ContaContabil | null>(
    null
  );
  const [contaToView, setContaToView] = useState<ContaContabil | null>(null);

  const fetchContas = async () => {
    try {
      const response = await api.get("/contas-contabeis");
      setContas(response.data);
    } catch (err) {
      toast.error("Falha ao buscar o plano de contas.");
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchContas();
    }
  }, [user, loading]);

  const handleOpenNewModal = () => {
    setContaToEdit(null);
    setIsFormModalOpen(true);
  };
  const handleOpenEditModal = (conta: ContaContabil) => {
    setContaToEdit(conta);
    setIsFormModalOpen(true);
  };
  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchContas();
  };

  const handleDelete = async () => {
    if (!contaToDelete) return;
    try {
      await api.delete(`/contas-contabeis/${contaToDelete.id}`);
      toast.success("Conta removida com sucesso!");
      setContaToDelete(null);
      fetchContas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao remover a conta.");
      setContaToDelete(null);
    }
  };

  const columns: ColumnDef<ContaContabil>[] = [
    { accessorKey: "codigo", header: "Código" },
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }) => {
        const level = (row.original.codigo.match(/\./g) || []).length;
        return (
          <div style={{ paddingLeft: `${level * 24}px` }}>
            {row.original.nome}
          </div>
        );
      },
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => <Badge variant="outline">{row.original.tipo}</Badge>,
    },
    {
      accessorKey: "aceitaLancamento",
      header: "Lançamento",
      cell: ({ row }) => (row.original.aceitaLancamento ? "Sim" : "Não"),
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
              <DropdownMenuItem onClick={() => setContaToView(conta)}>
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEditModal(conta)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setContaToDelete(conta)}
                className="text-red-600 focus:text-red-600"
              >
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) return <p>Carregando...</p>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Plano de Contas</CardTitle>
            <Button onClick={handleOpenNewModal}>Nova Conta</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={contas}
            filterColumnId="nome"
            filterPlaceholder="Filtrar por nome da conta..."
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={contaToEdit ? "Editar Conta" : "Nova Conta"}
        description="Preencha os detalhes da conta contábil."
      >
        <ContaContabilForm conta={contaToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog open={!!contaToView} onOpenChange={() => setContaToView(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <DetailItem label="Código" value={contaToView?.codigo} />
            <DetailItem label="Nome" value={contaToView?.nome} />
            <DetailItem label="Tipo" value={contaToView?.tipo} />
            <DetailItem
              label="Aceita Lançamento"
              value={contaToView?.aceitaLancamento}
            />
            <DetailItem
              label="Conta Pai"
              value={
                contaToView?.contaPaiId
                  ? (contas.find((c) => c.id === contaToView.contaPaiId)
                      ?.nome ?? "Não encontrada")
                  : "Nenhuma"
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContaToView(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!contaToDelete}
        onOpenChange={() => setContaToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a conta "{contaToDelete?.nome}"?
              Esta ação não pode ser desfeita.
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
