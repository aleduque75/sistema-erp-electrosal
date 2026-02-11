"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
import { ProductForm } from "./product-form";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
}

export default function ProductsPage() {
  const { user, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const totalStockValue = useMemo(() => {
    return products.reduce((acc, product) => {
      return acc + product.price * product.stock;
    }, 0);
  }, [products]);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (err) {
      toast.error("Falha ao buscar produtos.");
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      fetchProducts();
    }
  }, [user, isLoading]);

  const handleOpenNewModal = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchProducts();
  };

  // ✅ Função handleDelete CORRIGIDA
  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success("Produto removido com sucesso!");
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      // <--- Início do bloco catch
      toast.error(err.response?.data?.message || "Falha ao remover produto.");
      setProductToDelete(null);
    } // <--- Fim do bloco catch
  };

  const columns: ColumnDef<Product>[] = [
    { accessorKey: "name", header: "Nome" },
    {
      accessorKey: "price",
      header: "Preço",
      cell: ({ row }) =>
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(row.getValue("price")),
    },
    { accessorKey: "stock", header: "Estoque" },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenEditModal(product)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setProductToDelete(product)}
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

  if (isLoading) return <p>Carregando...</p>;

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
            <CardTitle>Produtos</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={handleOpenNewModal}>Novo Produto</Button>
              <Link href="/products/import-xml">
                <Button variant="outline">Importar XML</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={products}
              filterColumnId="name"
              filterPlaceholder="Filtrar por nome do produto..."
            />
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={productToEdit ? "Editar Produto" : "Novo Produto"}
        description="Preencha os detalhes do produto aqui."
      >
        <ProductForm product={productToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o produto "{productToDelete?.name}
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
