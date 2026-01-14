"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal, DollarSign } from "lucide-react";
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
import { RawMaterialForm } from "./raw-material-form";

interface RawMaterial {
  id: string;
  name: string;
  description?: string | null;
  cost: number;
  stock: number;
  unit: string;
}

export default function RawMaterialsPage() {
  const { user, loading } = useAuth();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [rawMaterialToEdit, setRawMaterialToEdit] = useState<RawMaterial | null>(null);
  const [rawMaterialToDelete, setRawMaterialToDelete] = useState<RawMaterial | null>(null);

  const totalStockValue = useMemo(() => {
    return rawMaterials.reduce((acc, rawMaterial) => {
      return acc + rawMaterial.cost * rawMaterial.stock;
    }, 0);
  }, [rawMaterials]);

  const fetchRawMaterials = async () => {
    try {
      const response = await api.get("/raw-materials");
      setRawMaterials(response.data);
    } catch (err) {
      toast.error("Falha ao buscar matérias-primas.");
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchRawMaterials();
    }
  }, [user, loading]);

  const handleOpenNewModal = () => {
    setRawMaterialToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (rawMaterial: RawMaterial) => {
    setRawMaterialToEdit(rawMaterial);
    setIsFormModalOpen(true);
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchRawMaterials();
  };

  const handleDelete = async () => {
    if (!rawMaterialToDelete) return;
    try {
      await api.delete(`/raw-materials/${rawMaterialToDelete.id}`);
      toast.success("Matéria-prima removida com sucesso!");
      setRawMaterialToDelete(null);
      fetchRawMaterials();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao remover matéria-prima.");
      setRawMaterialToDelete(null);
    }
  };

  const columns: ColumnDef<RawMaterial>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          {row.original.description && (
            <span className="text-[10px] text-muted-foreground leading-tight">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "cost",
      header: "Custo",
      cell: ({ row }) =>
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(row.getValue("cost")),
    },
    { accessorKey: "stock", header: "Estoque" },
    { accessorKey: "unit", header: "Unidade" },
    {
      id: "actions",
      cell: ({ row }) => {
        const rawMaterial = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenEditModal(rawMaterial)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRawMaterialToDelete(rawMaterial)}
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
    <div className="space-y-2">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total em Estoque
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalStockValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle>Matérias-Primas</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={handleOpenNewModal}>Nova Matéria-Prima</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={rawMaterials}
              filterColumnId="name"
              filterPlaceholder="Filtrar por nome da matéria-prima..."
            />
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={rawMaterialToEdit ? "Editar Matéria-Prima" : "Nova Matéria-Prima"}
        description="Preencha os detalhes da matéria-prima aqui."
      >
        <RawMaterialForm rawMaterial={rawMaterialToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!rawMaterialToDelete}
        onOpenChange={() => setRawMaterialToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a matéria-prima "{rawMaterialToDelete?.name}
              "? Esta ação não pode ser desfeita.
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
