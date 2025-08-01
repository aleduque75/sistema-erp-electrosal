"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal, Upload } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card, CardContent } from "@/components/ui/card";
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

// Interface
interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
}

// Componente auxiliar
const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) =>
  value ? (
    <div>
      {" "}
      <p className="text-sm font-medium text-muted-foreground">{label}</p>{" "}
      <p>{value}</p>{" "}
    </div>
  ) : null;

export default function ClientsPage() {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientToView, setClientToView] = useState<Client | null>(null);

  const fetchClients = async () => {
    try {
      const response = await api.get("/clients");
      setClients(response.data);
    } catch (err) {
      toast.error("Falha ao buscar clientes.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

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
    { accessorKey: "name", header: "Nome" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Telefone" },
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

  if (loading) return <p className="text-center p-10">Carregando...</p>;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex space-x-2">
          <Link href="/clients/import" passHref>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
          </Link>
          <Button onClick={handleOpenNewModal}>Novo Cliente</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <DataTable columns={columns} data={clients} filterColumnId="name" />
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={clientToEdit ? "Editar Cliente" : "Novo Cliente"}
        description="Preencha os detalhes do cliente aqui."
      >
        <ClientForm initialData={clientToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!clientToView}
        onOpenChange={(isOpen) => !isOpen && setClientToView(null)}
      >
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

      <Dialog
        open={!!clientToDelete}
        onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}
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
