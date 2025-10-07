'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { NewSaleForm } from './components/NewSaleForm';
import { SaleDetailsModal } from './sale-details-modal';
import { ConfirmSaleModal } from './components/ConfirmSaleModal';

// Temporary updated Sale type
export interface Sale {
  id: string;
  orderNumber: string;
  pessoa: { name: string };
  totalAmount: number;
  feeAmount: number;
  netAmount: number;
  goldPrice: number;
  goldValue: number;
  paymentMethod: string;
  createdAt: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'A_SEPARAR' | 'FINALIZADO' | 'CANCELADO';
  saleItems: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: { name: string };
    inventoryLotId?: string;
  }[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value || 0
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const statusConfig: { [key in Sale['status']]: { label: string; className: string } } = {
  PENDENTE: { label: 'Pendente', className: 'text-yellow-600 bg-yellow-100' },
  CONFIRMADO: { label: 'Confirmado', className: 'text-blue-600 bg-blue-100' },
  A_SEPARAR: { label: 'A Separar', className: 'text-orange-600 bg-orange-100' },
  FINALIZADO: { label: 'Finalizado', className: 'text-green-600 bg-green-100' },
  CANCELADO: { label: 'Cancelado', className: 'text-red-600 bg-red-100' },
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToConfirm, setSaleToConfirm] = useState<Sale | null>(null);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (err) {
      toast.error('Falha ao buscar vendas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleSaveSuccess = () => {
    setIsNewSaleModalOpen(false);
    fetchSales();
  };

  const handleCancelSale = async (saleId: string) => {
    if (!confirm('Tem certeza que deseja CANCELAR esta venda? Esta ação é irreversível.')) return;
    try {
      await api.patch(`/sales/${saleId}/cancel`);
      toast.success('Venda cancelada com sucesso!');
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao cancelar venda.');
    }
  };

  const handleRevertSale = async (saleId: string) => {
    if (!confirm('Tem certeza que deseja REVERTER esta venda para PENDENTE? Todo o estoque e financeiro serão estornados.')) return;
    try {
      await api.patch(`/sales/${saleId}/revert`);
      toast.success('Venda revertida para PENDENTE com sucesso!');
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao reverter venda.');
    }
  };

  const handleReleaseToPcp = async (saleId: string) => {
    if (!confirm('Deseja liberar este pedido para separação no PCP sem confirmar o pagamento?')) return;
    try {
      await api.patch(`/sales/${saleId}/release-to-pcp`);
      toast.success('Venda liberada para separação!');
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao liberar para separação.');
    }
  };

  const columns: ColumnDef<Sale>[] = [
    { accessorKey: 'orderNumber', header: 'Nº Pedido' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status] || { label: status, className: '' };
        return (
          <Badge variant="outline" className={`border-none ${config.className}`}>
            {config.label}
          </Badge>
        );
      },
    },
    { accessorKey: 'pessoa.name', header: 'Cliente' },
    {
      accessorKey: 'createdAt',
      header: 'Data',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Pagamento',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.paymentMethod?.replace('_', ' ') || 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'netAmount',
      header: () => <div className="text-right">Valor Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(Number(row.original.netAmount))}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const sale = row.original;
        const isRevertible = ['CONFIRMADO', 'A_SEPARAR', 'FINALIZADO'].includes(sale.status);

        return (
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
                <DropdownMenuItem onClick={() => setSelectedSale(sale)}>Ver Detalhes</DropdownMenuItem>
                <DropdownMenuSeparator />
                {sale.status === 'PENDENTE' && (
                  <>
                    <DropdownMenuItem onClick={() => setSaleToConfirm(sale)}>Confirmar Pagamento</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReleaseToPcp(sale.id)}>Liberar para Separação</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSale(sale.id)}>Cancelar Venda</DropdownMenuItem>
                  </>
                )}
                {sale.status === 'A_SEPARAR' && (
                  <DropdownMenuItem onClick={() => setSaleToConfirm(sale)}>Confirmar Pagamento</DropdownMenuItem>
                )}
                {isRevertible && (
                  <DropdownMenuItem className="text-red-600" onClick={() => handleRevertSale(sale.id)}>
                    Reverter para Pendente
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendas</h1>
        <Dialog open={isNewSaleModalOpen} onOpenChange={setIsNewSaleModalOpen}>
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

      {saleToConfirm && (
        <ConfirmSaleModal
          sale={saleToConfirm}
          open={!!saleToConfirm}
          onOpenChange={(open) => !open && setSaleToConfirm(null)}
          onSuccess={() => {
            setSaleToConfirm(null);
            fetchSales();
          }}
        />
      )}
    </div>
  );
}