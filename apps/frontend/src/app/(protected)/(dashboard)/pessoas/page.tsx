"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal, Upload } from "lucide-react";
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

// Interface atualizada para Pessoa
interface Pessoa {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  client: object | null; // A presença indica o papel
  fornecedor: object | null;
  funcionario: object | null;
}

type Role = 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO';

export default function PessoasPage() {
  const { user, isLoading } = useAuth();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [pessoaToEdit, setPessoaToEdit] = useState<Pessoa | null>(null);
  const [pessoaToDelete, setPessoaToDelete] = useState<Pessoa | null>(null);

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

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchPessoas();
  };

  const handleDelete = async () => {
    if (!pessoaToDelete) return;
    try {
      // TODO: O endpoint de delete precisa ser verificado no backend
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
              <DropdownMenuItem onClick={() => handleOpenEditModal(pessoa)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setPessoaToDelete(pessoa)}
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

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={pessoaToEdit ? "Editar Pessoa" : "Nova Pessoa"}
        description="Preencha os detalhes da pessoa aqui."
        className="sm:max-w-3xl"
      >
        <PessoaForm initialData={pessoaToEdit} onSave={handleSave} />
      </ResponsiveDialog>

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
