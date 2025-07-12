"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { ClientForm } from "./client-form";

// ✨ 1. Interface completa do cliente, incluindo todos os campos
interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
}

// ✨ 2. Componente auxiliar para exibir os detalhes no modal de visualização
const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) =>
  value ? (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  ) : null;

export default function ClientsPage() {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientToView, setClientToView] = useState<Client | null>(null); // ✨ 3. Estado para o modal de visualização

  const fetchClients = async () => {
    try {
      const response = await api.get("/clients");
      setClients(response.data);
    } catch (err) {
      toast.error("Falha ao buscar clientes.");
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchClients();
    }
  }, [user, loading]);

  const handleOpenNewModal = () => {
    setClientToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setClientToEdit(client);
    setIsFormModalOpen(true);
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchClients();
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      toast.success("Cliente removido com sucesso!");
      setClientToDelete(null);
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao remover cliente.");
      setClientToDelete(null);
    }
  };

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Telefone",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original;
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
              {/* ✨ 4. Ação para abrir o modal de visualização */}
              <DropdownMenuItem onClick={() => setClientToView(client)}>
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEditModal(client)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setClientToDelete(client)}
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
            <CardTitle>Clientes</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={handleOpenNewModal}>Novo Cliente</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={clients} filterColumnId="name" />
        </CardContent>
      </Card>

      {/* Modal Responsivo para CRIAR/EDITAR */}
      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={clientToEdit ? "Editar Cliente" : "Novo Cliente"}
        description="Preencha os detalhes do cliente aqui."
      >
        <ClientForm client={clientToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      {/* ✨ 5. Modal para VISUALIZAR os detalhes do cliente */}
      <Dialog open={!!clientToView} onOpenChange={() => setClientToView(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes de {clientToView?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <DetailItem label="Nome Completo" value={clientToView?.name} />
            <DetailItem label="Email" value={clientToView?.email} />
            <DetailItem label="Telefone" value={clientToView?.phone} />
            <DetailItem label="Endereço" value={clientToView?.address} />
            <DetailItem label="Gênero" value={clientToView?.gender} />
            <DetailItem
              label="Data de Nascimento"
              value={
                clientToView?.birthDate
                  ? format(new Date(clientToView.birthDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : null
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientToView(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para CONFIRMAR DELEÇÃO */}
      <Dialog
        open={!!clientToDelete}
        onOpenChange={() => setClientToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o cliente "{clientToDelete?.name}"?
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
