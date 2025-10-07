"use client";

import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/page-header";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // ADDED
import { ContaMetalForm } from "./conta-metal-form"; // ADDED

interface ContaMetal {
  id: string;
  name: string;
  metalType: string;
  balance: number;
}

export default function ContasMetaisPage() {
  const [contasMetais, setContasMetais] = useState<ContaMetal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // ADDED

  const fetchContasMetais = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/contas-metais");
      setContasMetais(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao carregar contas de metais.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContasMetais();
  }, []);

  const columns = [
    {
      accessorKey: "name",
      header: "Nome da Conta",
    },
    {
      accessorKey: "metalType",
      header: "Tipo de Metal",
    },
    {
      accessorKey: "balance",
      header: "Saldo (g)",
      cell: ({ row }: any) => Number(row.original.balance || 0).toFixed(4),
    },
    // TODO: Adicionar coluna de ações (editar, excluir)
  ];

  const handleSave = () => { // ADDED
    setIsModalOpen(false); // ADDED
    fetchContasMetais(); // ADDED
  }; // ADDED

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader
        title="Contas de Metais"
        description="Gerencie suas contas de metais preciosos."
        actions={
          <Button onClick={() => setIsModalOpen(true)}> {/* MODIFIED */}
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Conta de Metal
          </Button>
        }
      />
      <DataTable columns={columns} data={contasMetais} isLoading={isLoading} />

      {/* ADDED MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta de Metal</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova conta de metal.
            </DialogDescription>
          </DialogHeader>
          <ContaMetalForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
