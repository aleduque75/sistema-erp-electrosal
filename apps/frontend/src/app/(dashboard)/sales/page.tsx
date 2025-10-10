'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
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
  lucro?: number;
  paymentAccountName?: string;
  adjustment?: {
    netDiscrepancyGrams: number;
  };
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

  // Filter states
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    orderNumber: '',
    clientId: '',
    status: '',
  });

  const [orderToDiagnose, setOrderToDiagnose] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);

  const fetchClients = async () => {
    try {
      const response = await api.get('/pessoas?role=CLIENT');
      const clientOptions = response.data.map((c: any) => ({ value: c.id, label: c.name }));
      setClients(clientOptions);
    } catch (err) {
      toast.error('Falha ao buscar clientes.');
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const fetchSales = async (filterOverride?: typeof filters) => {
    setIsLoading(true);
    try {
      const activeFilters = filterOverride ?? filters;
      const params = new URLSearchParams();
      if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
      if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
      if (activeFilters.orderNumber) params.append('orderNumber', activeFilters.orderNumber);
      if (activeFilters.clientId) params.append('clientId', activeFilters.clientId);
      if (activeFilters.status) params.append('status', activeFilters.status);

      const response = await api.get(`/sales?${params.toString()}`);
      setSales(response.data);
    } catch (err) {
      toast.error('Falha ao buscar vendas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchSales(); // Initial fetch
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSales();
  };

  const handleClearFilters = () => {
    const initialFilters = {
      startDate: '',
      endDate: '',
      orderNumber: '',
      clientId: '',
      status: '',
    };
    setFilters(initialFilters);
    fetchSales(initialFilters);
  };

  const handleDiagnose = async () => {
    if (!orderToDiagnose) return;
    try {
      const response = await api.get(`/sales/diagnose/${orderToDiagnose}`);
      setDiagnosticResult(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao buscar dados de diagnóstico.');
      setDiagnosticResult({ error: err.response?.data?.message || 'Erro desconhecido.' });
    }
  };

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
      cell: ({ row }) => {
        const sale = row.original;
        const paymentText = sale.paymentAccountName || sale.paymentMethod?.replace('_', ' ') || 'N/A';
        return (
          <Badge variant="outline">
            {paymentText}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'goldPrice',
      header: () => <div className="text-right">Cotação</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(Number(row.original.goldPrice))}
        </div>
      ),
    },

    {
      accessorKey: 'adjustment',
      header: () => <div className="text-right">Lucro (g)</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm">
          {row.original.adjustment ? `${Number(row.original.adjustment.grossDiscrepancyGrams).toFixed(4)}g` : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'netAmount',
      header: () => <div className="text-right">Valor Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(Number(row.original.adjustment?.paymentReceivedBRL || 0))}
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
                    <DropdownMenuItem onClick={() => handleReleaseToPcp(sale.id)}>Liberar para Separação</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSale(sale.id)}>Cancelar Venda</DropdownMenuItem>
                  </>
                )}
                {sale.status === 'A_SEPARAR' && (
                  <DropdownMenuItem onClick={() => setSelectedSale(sale)}>Confirmar Pagamento</DropdownMenuItem>
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
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input id="startDate" type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input id="endDate" type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Nº Pedido</Label>
              <Input id="orderNumber" type="text" placeholder="Buscar número..." value={filters.orderNumber} onChange={e => handleFilterChange('orderNumber', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Combobox options={clients} value={filters.clientId} onChange={value => handleFilterChange('clientId', value)} placeholder="Selecione um cliente..." />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={value => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Filtrar</Button>
              <Button type="button" variant="outline" onClick={handleClearFilters}>Limpar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnosticar Venda</CardTitle>
          <CardDescription>Digite o número de um pedido para ver os dados financeiros brutos que o sistema está usando para os cálculos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input 
              type="text" 
              placeholder="Nº do Pedido..." 
              value={orderToDiagnose} 
              onChange={(e) => setOrderToDiagnose(e.target.value)}
            />
            <Button onClick={handleDiagnose}>Diagnosticar</Button>
          </div>
          {diagnosticResult && (
            <pre className="mt-4 p-4 bg-muted rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(diagnosticResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

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
          onSave={fetchSales}
        />
      )}
    </div>
  );
}