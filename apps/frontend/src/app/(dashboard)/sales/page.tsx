"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { NewSaleForm } from "./components/NewSaleForm"; // Importando o formulário de nova venda
import { SaleDetailsModal } from "./sale-details-modal"; // Importando o modal de detalhes da venda

import { Sale } from "@/types/sale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null); // Novo estado

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/sales");
      setSales(response.data);
    } catch (err) {
      toast.error("Falha ao buscar vendas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleSaveSuccess = () => {
    setIsModalOpen(false); // Fecha o modal
    fetchSales(); // Apenas busca os dados novamente, sem recarregar a página
  };

  const handleCancelSale = async (saleId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta venda? Esta ação é irreversível.")) return;
    try {
      await api.delete(`/sales/${saleId}`);
      toast.success("Venda cancelada com sucesso!");
      fetchSales(); // Atualiza a lista de vendas
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao cancelar venda.");
    }
  };

  const columns: ColumnDef<Sale>[] = [
    { accessorKey: "orderNumber", header: "Nº Pedido" },
    { accessorKey: "pessoa.name", header: "Cliente" },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "paymentMethod",
      header: "Pagamento",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.paymentMethod.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "goldValue",
      header: () => <div className="text-right">Valor em Ouro</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {Number(row.original.goldValue).toFixed(4)} g
        </div>
      ),
    },
    {
      accessorKey: "netAmount",
      header: () => <div className="text-right">Valor Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.netAmount)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedSale(row.original)}>Ver Detalhes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCancelSale(row.original.id)}>Cancelar Venda</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendas</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Registrar Nova Venda</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <NewSaleForm onSave={handleSaveSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={sales}
            filterColumnId="orderNumber"
          />
        </CardContent>
      </Card>

      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          open={!!selectedSale}
          onOpenChange={(open) => !open && setSelectedSale(null)}
        />
      )}
    </div>
  );
}
