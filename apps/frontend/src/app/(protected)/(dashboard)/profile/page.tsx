"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { UserForm } from "./user-form"; // Assumindo que o formulário será criado

// Interface para o Usuário
interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Ex: ADMIN, USER
}

export default function ProfilePage() {
  const { user: currentUser, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users"); // Endpoint para buscar todos os usuários
      setUsers(response.data);
    } catch (err) {
      toast.error("Falha ao buscar usuários.");
    }
  };

  useEffect(() => {
    if (!loading && currentUser) {
      fetchUsers();
    }
  }, [currentUser, loading]);

  const handleOpenNewModal = () => {
    setUserToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setUserToEdit(user);
    setIsFormModalOpen(true);
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success("Usuário removido com sucesso!");
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao remover usuário.");
      setUserToDelete(null);
    }
  };

  const columns: ColumnDef<User>[] = [
    { accessorKey: "name", header: "Nome" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Função" },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenEditModal(user)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setUserToDelete(user)}
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <Button onClick={handleOpenNewModal}>Novo Usuário</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={users}
              filterColumnId="name"
              filterPlaceholder="Filtrar por nome..."
            />
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={userToEdit ? "Editar Usuário" : "Novo Usuário"}
        description="Preencha os detalhes do usuário."
      >
        <UserForm user={userToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o usuário "{userToDelete?.name}"?
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
    </div>
  );
}
