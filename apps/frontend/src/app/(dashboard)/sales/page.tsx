"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { SaleDetailsModal } from "./sale-details-modal";
import { NewSaleForm } from "./new-sale-form";

interface Sale {
  id: string;
  client: { name: string };
  totalAmount: number;
  createdAt: string;
}

export default function SalesPage() {
  const { user, loading: authLoading } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Estados para controlar todos os modais
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [saleToView, setSaleToView] = useState<string | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // Estado para a busca com debounce
  const [searchTerm, setSearchTerm] = useState("");

  // useEffect para debounce da busca
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Só busca se o usuário estiver logado
      if (!authLoading && user) {
        fetchSales(searchTerm);
      }
    }, 500); // Atraso de 500ms antes de fazer a busca

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user, authLoading]);

  const fetchSales = async (search: string = "") => {
    setIsFetching(true);
    try {
      const response = await api.get("/sales", { params: { search } });
      setSales(
        response.data.map((sale: any) => ({
          ...sale,
          totalAmount: parseFloat(sale.totalAmount),
        }))
      );
    } catch (err) {
      toast.error("Não foi possível carregar as vendas.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    try {
      await api.delete(`/sales/${saleToDelete.id}`);
      toast.success("Venda excluída com sucesso!");
      setSaleToDelete(null);
      // Remove o item da lista localmente para uma resposta visual instantânea
      setSales(sales.filter((s) => s.id !== saleToDelete.id));
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Não foi possível excluir a venda."
      );
      setSaleToDelete(null);
    }
  };

  const handleSaveSale = () => {
    setIsNewSaleModalOpen(false); // Fecha o modal de nova venda
    fetchSales(searchTerm); // Atualiza a lista de vendas
  };

  const columns: ColumnDef<Sale>[] = [
    { accessorKey: "client.name", header: "Cliente" },
    {
      accessorKey: "totalAmount",
      header: "Valor Total",
      cell: ({ row }) =>
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(row.getValue("totalAmount")),
    },
    {
      accessorKey: "createdAt",
      header: "Data da Venda",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        if (!date) return "-";
        return new Date(date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sale = row.original;
        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSaleToView(sale.id)}>
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSaleToDelete(sale)}
                  className="text-red-600 focus:text-red-600"
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (authLoading) return <p className="text-center p-10">Carregando...</p>;
  if (!user)
    return <p className="text-center p-10">Faça login para continuar.</p>;

  return (
    <>
      <Card className="mx-auto my-8 bg-fuchsia-200/60 dark:bg-gray-900">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-3xl font-bold">
              Listagem de Vendas
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button
                onClick={() => setIsNewSaleModalOpen(true)}
                className="flex items-center gap-2 w-full"
              >
                <PlusCircle className="w-5 h-5" /> Nova Venda
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p className="text-center p-10">Buscando vendas...</p>
          ) : sales.length === 0 ? (
            <p className="text-center p-10">Nenhuma venda encontrada.</p>
          ) : (
            <DataTable
              columns={columns}
              data={sales}
              filterColumnId="client.name"
            />
          )}
        </CardContent>
      </Card>

      {/* Modal para Nova Venda */}
      <Dialog open={isNewSaleModalOpen} onOpenChange={setIsNewSaleModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Registrar Nova Venda</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4">
            <NewSaleForm onSave={handleSaveSale} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Visualizar Detalhes */}
      <SaleDetailsModal
        saleId={saleToView}
        open={!!saleToView}
        onOpenChange={() => setSaleToView(null)}
      />

      {/* Modal para Confirmar Exclusão */}
      <Dialog open={!!saleToDelete} onOpenChange={() => setSaleToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta venda? Esta ação é
              irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteSale}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
