'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MoreHorizontal, PlusCircle, ArrowUpDown } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { NewSaleForm } from './components/NewSaleForm';
import { SaleDetailsModal } from './sale-details-modal';
import { EditSaleModal } from './components/EditSaleModal';
import { ConfirmSaleModal } from './components/ConfirmSaleModal';
import { ReceivePaymentForm } from '../accounts-rec/components/receive-payment-form';

// ... (existing interfaces)

// ... (existing component code)

export default function SalesPage() {
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
    SEPARADO: { label: 'Separado', className: 'text-purple-600 bg-purple-100' },
    FINALIZADO: { label: 'Finalizado', className: 'text-green-600 bg-green-100' },
    CANCELADO: { label: 'Cancelado', className: 'text-red-600 bg-red-600' },
  };

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [saleToConfirm, setSaleToConfirm] = useState<Sale | null>(null);
  const [accountToReceive, setAccountToReceive] = useState<Sale['accountsRec'][0] | null>(null);
  const [rowSelection, setRowSelection] = useState({});

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

  const handleSeparateSale = async (saleId: string) => {
    if (!confirm('Deseja marcar este pedido como separado?')) return;
    try {
      await api.patch(`/sales/${saleId}/separate`);
      toast.success('Venda marcada como separada!');
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao separar a venda.');
    }
  };

  const handleBulkConfirm = async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedSales = sales.filter((_, index) => selectedIndices.includes(index));
    const selectedSaleIds = selectedSales.map(sale => sale.id);

    if (selectedSaleIds.length === 0) {
      toast.info('Nenhuma venda selecionada.');
      return;
    }

    if (!confirm(`Tem certeza que deseja confirmar ${selectedSaleIds.length} venda(s)?`)) return;

    try {
      const response = await api.post('/sales/bulk-confirm', { saleIds: selectedSaleIds });
      toast.success(`${response.data.filter(r => r.status === 'success').length} venda(s) confirmada(s) com sucesso.`);
      
      const errors = response.data.filter(r => r.status === 'error');
      if (errors.length > 0) {
        errors.forEach(err => {
          // It's better to find the orderNumber to show in the toast
          const sale = sales.find(s => s.id === err.saleId);
          const orderNumber = sale ? sale.orderNumber : err.saleId;
          toast.error(`Falha ao confirmar venda #${orderNumber}: ${err.message}`);
        });
      }
      
      fetchSales();
      setRowSelection({});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao confirmar vendas em lote.');
    }
  };

  const columns: ColumnDef<Sale>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
          {row.original.adjustment ? `${Number(row.original.adjustment.netDiscrepancyGrams).toFixed(4)}g` : '-'}
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
        // REGRA FINAL: Reverter está disponível em todos os status, exceto no PENDENTE.
        const isRevertible = sale.status !== 'PENDENTE';

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
                
                <DropdownMenuItem onClick={() => setSelectedSale(sale)}>
                  Ver Detalhes
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                {/* Ações para PENDENTE */}
                {sale.status === 'PENDENTE' && (
                  <>
                    <DropdownMenuItem onClick={() => setSaleToEdit(sale)}>Editar Pedido</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReleaseToPcp(sale.id)}>Liberar para Separação</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSale(sale.id)}>Cancelar Venda</DropdownMenuItem>
                  </>
                )}

                {/* Ações para A_SEPARAR */}
                {sale.status === 'A_SEPARAR' && (
                  <DropdownMenuItem onClick={() => handleSeparateSale(sale.id)}>Marcar como Separado</DropdownMenuItem>
                )}

                {/* Ações para A_SEPARAR ou SEPARADO */}
                {(sale.status === 'A_SEPARAR' || sale.status === 'SEPARADO') && (
                  <DropdownMenuItem onClick={() => setSaleToConfirm(sale)}>
                    Confirmar Venda
                  </DropdownMenuItem>
                )}

                {/* Ação de Reverter (aparece em todos os status, menos PENDENTE) */}
                {isRevertible && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => handleRevertSale(sale.id)}>
                      Reverter para Pendente
                    </DropdownMenuItem>
                  </>
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
          <div className="flex items-center gap-2 mb-4">
            {Object.keys(rowSelection).length > 0 && (
              <Button onClick={handleBulkConfirm}>
                Confirmar {Object.keys(rowSelection).length} Venda(s)
              </Button>
            )}
          </div>
          <DataTable
            columns={columns}
            data={sales}
            filterColumnId="orderNumber"
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
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

      {saleToEdit && (
        <EditSaleModal
          sale={saleToEdit}
          open={!!saleToEdit}
          onOpenChange={(open) => !open && setSaleToEdit(null)}
          onSave={fetchSales}
        />
      )}

      {saleToConfirm && (
        <ConfirmSaleModal
          sale={saleToConfirm}
          open={!!saleToConfirm}
          onOpenChange={(open) => !open && setSaleToConfirm(null)}
          onSuccess={() => { fetchSales(); setSaleToConfirm(null); }}
        />
      )}

    </div>
  );
}