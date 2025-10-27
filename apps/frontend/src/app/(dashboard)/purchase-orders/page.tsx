"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { PurchaseOrderForm } from "./purchase-order-form";

// Interfaces
interface PurchaseOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: "PENDING" | "RECEIVED" | "CANCELED";
  orderDate: string;
  expectedDeliveryDate?: string | null;
  fornecedorId: string; // ID da Pessoa que é o fornecedor
  items: PurchaseOrderItem[]; // Added missing items property
  fornecedor: { pessoa: { name: string } }; // Keep this for display
}

interface PurchaseOrderItem { // Define PurchaseOrderItem here as well
  productId?: string;
  rawMaterialId?: string;
  quantity: number;
  price: number;
  productName?: string;
  rawMaterialName?: string;
}

export default function PurchaseOrdersPage() {
  const { user, loading } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);
  const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null);

  const fetchPurchaseOrders = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get("/purchase-orders");
      setPurchaseOrders(response.data);
    } catch (err) {
      toast.error("Falha ao buscar pedidos de compra.");
    }
  }, [user]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const handleOpenNewModal = () => {
    setOrderToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (order: PurchaseOrder) => {
    setOrderToEdit(order);
    setIsFormModalOpen(true);
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchPurchaseOrders();
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      await api.delete(`/purchase-orders/${orderToDelete.id}`);
      toast.success("Pedido de compra removido com sucesso!");
      setOrderToDelete(null);
      fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao remover pedido de compra.");
      setOrderToDelete(null);
    }
  };

  const handleReceive = async () => {
    if (!orderToReceive) return;
    try {
      await api.post(`/purchase-orders/${orderToReceive.id}/receive`);
      toast.success("Mercadoria recebida com sucesso!");
      setOrderToReceive(null);
      fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao receber mercadoria.");
      setOrderToReceive(null);
    }
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    { accessorKey: "orderNumber", header: "Número do Pedido" },
    { accessorKey: "fornecedor.pessoa.name", header: "Fornecedor" },
    { accessorKey: "totalAmount", header: "Valor Total" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
        if (status === "PENDING") variant = "default";
        if (status === "RECEIVED") variant = "outline";
        if (status === "CANCELED") variant = "destructive";
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: "orderDate",
      header: "Data do Pedido",
      cell: ({ row }) => format(new Date(row.original.orderDate), "dd/MM/yyyy", { locale: ptBR }),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
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
              <DropdownMenuItem onClick={() => handleOpenEditModal(order)}>
                Editar
              </DropdownMenuItem>
              {order.status === 'PENDING' && (
                <DropdownMenuItem onClick={() => setOrderToReceive(order)}>
                  Receber Mercadoria
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOrderToDelete(order)}
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
        <h1 className="text-2xl font-bold">Pedidos de Compra</h1>
        <Button onClick={handleOpenNewModal}>Novo Pedido de Compra</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <DataTable columns={columns} data={purchaseOrders} filterColumnId="orderNumber" />
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={orderToEdit ? "Editar Pedido de Compra" : "Novo Pedido de Compra"}
        description="Preencha os detalhes do pedido de compra aqui."
      >
        <PurchaseOrderForm initialData={orderToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!orderToDelete}
        onOpenChange={(isOpen) => !isOpen && setOrderToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o pedido de compra "{orderToDelete?.orderNumber}"?
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

      <Dialog
        open={!!orderToReceive}
        onOpenChange={(isOpen) => !isOpen && setOrderToReceive(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja confirmar o recebimento da mercadoria para o pedido "{orderToReceive?.orderNumber}"?
              Esta ação irá atualizar o estoque e gerar as contas a pagar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleReceive}>
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
