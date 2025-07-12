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
import { CreditCardForm } from "./credit-card-form";

interface CreditCard {
  id: string;
  name: string;
  flag: string;
  closingDay: number;
  dueDate: number;
}

export default function CreditCardsPage() {
  const { user, loading } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

  const fetchCards = async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/credit-cards");
      setCards(response.data);
    } catch (err) {
      toast.error("Falha ao carregar cartões.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !loading) fetchCards();
  }, [user, loading]);

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchCards();
  };
  const handleDelete = async () => {
    if (!cardToDelete) return;
    try {
      await api.delete(`/credit-cards/${cardToDelete.id}`);
      toast.success("Cartão excluído com sucesso!");
      setCards(cards.filter((c) => c.id !== cardToDelete.id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir.");
    } finally {
      setCardToDelete(null);
    }
  };

  const handleOpenNewModal = () => {
    setCardToEdit(null);
    setIsFormModalOpen(true);
  };
  const handleOpenEditModal = (card: CreditCard) => {
    setCardToEdit(card);
    setIsFormModalOpen(true);
  };

  const columns: ColumnDef<CreditCard>[] = [
    { accessorKey: "name", header: "Nome do Cartão" },
    { accessorKey: "flag", header: "Bandeira" },
    { accessorKey: "closingDay", header: "Dia Fechamento" },
    { accessorKey: "dueDate", header: "Dia Vencimento" },
    {
      id: "actions",
      cell: ({ row }) => {
        const card = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenEditModal(card)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCardToDelete(card)}
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
            <CardTitle>Meus Cartões de Crédito</CardTitle>
            <Button onClick={handleOpenNewModal}>Novo Cartão</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p>Buscando cartões...</p>
          ) : (
            <DataTable
              columns={columns}
              data={cards}
              filterColumnId="name"
              filterPlaceholder="Pesquisar por nome..."
            />
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={cardToEdit ? "Editar Cartão" : "Novo Cartão"}
        description="Preencha os detalhes do seu cartão de crédito."
      >
        <CreditCardForm card={cardToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog open={!!cardToDelete} onOpenChange={(open) => {
        if (!open) setCardToDelete(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cartão "{cardToDelete?.name}"?
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
