'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MoreHorizontal, PlusCircle, ArrowUpDown, Printer, RotateCcw, Truck, Copy, Filter, SlidersHorizontal, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
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
import { ApplyCommissionModal } from './components/ApplyCommissionModal';
import { EditObservationModal } from './components/EditObservationModal';
import { UpdateShippingCostModal } from './components/UpdateShippingCostModal';
import { ReceivePaymentForm } from '../accounts-rec/components/receive-payment-form';
import { Sale } from '@/types/sale';

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
    FINALIZADO: { label: 'Finalizado', className: 'text-[hsl(var(--status-finalizado-text))] bg-[hsl(var(--status-finalizado-bg))] border border-[hsl(var(--status-finalizado-text)/0.2)]' },
    CANCELADO: { label: 'Cancelado', className: 'text-red-600 bg-red-600' },
    PAGO_PARCIALMENTE: { label: 'Pago Parcial', className: 'text-cyan-600 bg-cyan-100' },
  };

  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setIsPageLoading] = useState(true);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [saleToEditObservation, setSaleToEditObservation] = useState<Sale | null>(null);
  const [saleToConfirm, setSaleToConfirm] = useState<Sale | null>(null);
  const [saleToApplyCommission, setSaleToApplyCommission] = useState<Sale | null>(null);
  const [saleToUpdateShipping, setSaleToUpdateShipping] = useState<Sale | null>(null);
  const [accountToReceive, setAccountToReceive] = useState<any | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<number, boolean>>({});

  // Filter states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    orderNumber: '',
    clientId: '',
    status: '',
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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

  const fetchSales = async (filterOverride?: typeof filters, pageOverride?: number) => {
    setIsPageLoading(true);
    try {
      const activeFilters = filterOverride ?? filters;
      const activePage = pageOverride ?? page;
      const params = new URLSearchParams();
      params.append('page', activePage.toString());
      params.append('limit', limit.toString());
      if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
      if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
      if (activeFilters.orderNumber) params.append('orderNumber', activeFilters.orderNumber);
      if (activeFilters.clientId) params.append('clientId', activeFilters.clientId);
      if (activeFilters.status) params.append('status', activeFilters.status);

      const response = await api.get(`/sales?${params.toString()}`);
      setSales(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      toast.error('Falha ao buscar vendas.');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchSales(); // Initial fetch
  }, [page]); // Re-fetch when page changes

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when filtering
    fetchSales(filters, 1);
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
    setPage(1);
    fetchSales(initialFilters, 1);
  };

  const handleDownloadPdf = async (sale: Sale) => {
    try {
      const response = await api.get(`/sales/${sale.id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pedido-${sale.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao baixar PDF do pedido.');
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

  const handleCopyAsText = () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedSales = sales.filter((_, index) => selectedIndices.includes(index));

    if (selectedSales.length === 0) {
      toast.info('Nenhuma venda selecionada.');
      return;
    }

    const textToCopy = selectedSales.map(sale => {
      const saleDate = new Date(sale.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
      });

      const pessoa = sale.pessoa as any; // Cast to any to access address fields if not typed in frontend yet
      const addressParts = [
        pessoa.logradouro,
        pessoa.numero,
        pessoa.complemento,
        pessoa.bairro,
        pessoa.cidade,
        pessoa.uf
      ].filter(Boolean);
      const address = addressParts.join(', ');
      const cep = pessoa.cep || '';
      const doc = pessoa.cnpj || pessoa.cpf || '';

      const itemsText = (sale.saleItems || []).map(item => {
        const product = item.product as any;
        // Use 'gr' as unit if stockUnit is 'GRAMS', otherwise use the unit name or 'un'
        let unit = 'gr';
        if (product?.stockUnit === 'KILOGRAMS') unit = 'kg';
        else if (product?.stockUnit === 'LITERS') unit = 'L';
        else if (product?.stockUnit === 'UNITS') unit = 'un';

        const goldQty = (item.quantity * (product?.goldValue || 0));

        // Format: 58,8 (using comma for decimals)
        const formattedQty = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(item.quantity);
        const formattedGoldQty = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(goldQty);

        return `Produto: ${product?.name}\nQtd ${product?.name}: ${formattedQty} ${unit}  /  Qtd Au: ${formattedGoldQty}`;
      }).join('\n');

      return `Pedido: ${sale.orderNumber}  - Data: ${saleDate}  - Cliente:  ${sale.pessoa.name}
Endereço NF: ${address}  - CEP: ${cep} 
CNPJ/CPF: ${doc}
${itemsText}`;
    }).join('\n\n--------------------------------------------------\n\n');

    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success('Texto copiado para a área de transferência!'))
      .catch(() => toast.error('Falha ao copiar texto.'));
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
      toast.success(`${response.data.filter((r: any) => r.status === 'success').length} venda(s) confirmada(s) com sucesso.`);

      const errors = response.data.filter((r: any) => r.status === 'error');
      if (errors.length > 0) {
        errors.forEach((err: any) => {
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
      id: 'products',
      header: 'Produtos',
      cell: ({ row }) => {
        const saleItems = row.original.saleItems;
        if (!saleItems || saleItems.length === 0) {
          return '-';
        }
        return (
          <div className="flex flex-col">
            {saleItems.map(item => (
              <span key={item.id}>
                {item.product?.name || 'Produto desconhecido'} ({item.quantity})
              </span>
            ))}
          </div>
        );
      },
    },
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
          <Badge variant="outline" className="border-white/10 bg-black/20 text-amber-500/80 font-bold text-[10px] px-2 py-0.5">
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

                <DropdownMenuItem onClick={() => handleDownloadPdf(sale)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Pedido
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setSaleToEditObservation(sale)}>
                  Editar Observação
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setSaleToApplyCommission(sale)}>
                  Incluir Comissão
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setSaleToUpdateShipping(sale)}>
                  <Truck className="mr-2 h-4 w-4" />
                  Incluir/Alterar Frete
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Ações para PENDENTE */}
                {sale.status === 'PENDENTE' && (
                  <>
                    <DropdownMenuItem onClick={() => setSaleToEdit(sale)}>Editar Pedido</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReleaseToPcp(sale.id)}>Liberar para Separação</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSaleToConfirm(sale)}>Confirmar Venda</DropdownMenuItem>
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
    <div className="space-y-4 p-1 md:p-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Vendas</h1>
          <Badge variant="secondary" className="h-6">
            {total} {total === 1 ? 'registro' : 'registros'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => fetchSales()} title="Atualizar lista">
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isNewSaleModalOpen} onOpenChange={setIsNewSaleModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[96vw] max-w-6xl h-[95vh] p-3 md:p-6 flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>Registrar Nova Venda</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                <NewSaleForm onSave={handleSaveSuccess} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Filters */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
              <Combobox options={clients} value={filters.clientId ?? ''} onChange={value => handleFilterChange('clientId', value)} placeholder="Selecione um cliente..." />
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
            <div className="flex gap-2 col-span-1 md:col-span-2 lg:col-span-5 justify-end">
              <Button type="submit">Filtrar</Button>
              <Button type="button" variant="outline" onClick={handleClearFilters}>Limpar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Mobile Collapsible Filter Bar */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center gap-2">
          <form onSubmit={handleFilterSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar pedido ou cliente..."
                value={filters.orderNumber}
                onChange={e => handleFilterChange('orderNumber', e.target.value)}
                className="pl-9 h-11 text-sm bg-card border-border shadow-sm rounded-lg"
              />
            </div>
          </form>
          <Button
            type="button"
            variant={isMobileFilterOpen || activeFilterCount > 0 ? "default" : "outline"}
            className="h-11 px-3.5 gap-2 relative shadow-sm rounded-lg"
            onClick={() => setIsMobileFilterOpen(prev => !prev)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs font-semibold">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-[11px] font-bold">
                {activeFilterCount}
              </span>
            )}
            {isMobileFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Collapsible Mobile Filter Panel */}
        {isMobileFilterOpen && (
          <Card className="p-4 space-y-3 bg-card border border-border shadow-md rounded-xl animate-in fade-in-50 slide-in-from-top-2 duration-200">
            <form onSubmit={(e) => { handleFilterSubmit(e); setIsMobileFilterOpen(false); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="mobileStartDate" className="text-xs">Data Inicial</Label>
                  <Input id="mobileStartDate" type="date" className="h-10 text-xs" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mobileEndDate" className="text-xs">Data Final</Label>
                  <Input id="mobileEndDate" type="date" className="h-10 text-xs" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Combobox options={clients} value={filters.clientId ?? ''} onChange={value => handleFilterChange('clientId', value)} placeholder="Selecione um cliente..." />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={filters.status} onValueChange={value => handleFilterChange('status', value)}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Selecione um status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 h-10 text-xs font-bold">
                  Aplicar Filtros
                </Button>
                <Button type="button" variant="outline" className="h-10 text-xs" onClick={handleClearFilters}>
                  Limpar
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <Card className="border-none md:border md:shadow-sm bg-transparent md:bg-card">
        <CardContent className="p-1 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            {Object.keys(rowSelection).length > 0 && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleBulkConfirm}>
                  Confirmar {Object.keys(rowSelection).length} Venda(s)
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyAsText}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Texto
                </Button>
              </div>
            )}
          </div>

          {/* Pagination Header / Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-card/60 backdrop-blur border rounded-lg shadow-sm">
            <div className="text-xs md:text-sm text-muted-foreground font-medium">
              Mostrando <span className="font-bold text-foreground">{sales.length}</span> de <span className="font-bold text-foreground">{total}</span> registros
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-semibold"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page <= 1 || loading}
              >
                Anterior
              </Button>
              <div className="text-xs font-bold px-2 py-1 bg-muted rounded">
                {page} / {Math.ceil(total / limit) || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-semibold"
                onClick={() => setPage(prev => prev + 1)}
                disabled={page >= Math.ceil(total / limit) || loading}
              >
                Próximo
              </Button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={sales}
              filterColumnId="orderNumber"
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-2.5">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground italic text-sm">Carregando vendas...</div>
            ) : sales.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic text-sm">Nenhuma venda encontrada.</div>
            ) : (
              sales.map((sale, idx) => {
                const config = statusConfig[sale.status] || { label: sale.status, className: '' };
                const saleItems = sale.saleItems || [];
                const totalQty = saleItems.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
                const isRevertible = sale.status !== 'PENDENTE';

                return (
                  <div
                    key={sale.id}
                    className="p-3.5 rounded-xl border border-border bg-card shadow-sm hover:border-primary/40 active:scale-[0.99] transition-all relative space-y-3"
                  >
                    {/* Header Row: Checkbox + Pedido/Cliente + Status + Actions Menu */}
                    <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Checkbox
                          checked={rowSelection[idx] || false}
                          className="h-5 w-5 rounded border-muted-foreground/40"
                          onCheckedChange={(checked) => {
                            setRowSelection(prev => ({
                              ...prev,
                              [idx]: !!checked
                            }));
                          }}
                        />
                        <div className="min-w-0" onClick={() => setSelectedSale(sale)}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">
                              #{sale.orderNumber}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(sale.createdAt)}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-foreground truncate mt-0.5">
                            {sale.pessoa?.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className={`border-none ${config.className} text-[10px] font-extrabold px-2 py-0.5 rounded-full`}>
                          {config.label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações do Pedido</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedSale(sale)}>
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(sale)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir Pedido
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSaleToEditObservation(sale)}>
                              Editar Observação
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSaleToApplyCommission(sale)}>
                              Incluir Comissão
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSaleToUpdateShipping(sale)}>
                              <Truck className="mr-2 h-4 w-4" />
                              Incluir/Alterar Frete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {sale.status === 'PENDENTE' && (
                              <>
                                <DropdownMenuItem onClick={() => setSaleToEdit(sale)}>Editar Pedido</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReleaseToPcp(sale.id)}>Liberar para Separação</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSaleToConfirm(sale)}>Confirmar Venda</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSale(sale.id)}>Cancelar Venda</DropdownMenuItem>
                              </>
                            )}
                            {sale.status === 'A_SEPARAR' && (
                              <DropdownMenuItem onClick={() => handleSeparateSale(sale.id)}>Marcar como Separado</DropdownMenuItem>
                            )}
                            {(sale.status === 'A_SEPARAR' || sale.status === 'SEPARADO') && (
                              <DropdownMenuItem onClick={() => setSaleToConfirm(sale)}>Confirmar Venda</DropdownMenuItem>
                            )}
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
                    </div>

                    {/* Middle Content Row: Products + Payment Method */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground" onClick={() => setSelectedSale(sale)}>
                      <div className="line-clamp-1 pr-2">
                        <span className="font-medium text-foreground">{totalQty} item(ns): </span>
                        {saleItems.map(i => i.product?.name).filter(Boolean).join(', ') || 'Nenhum produto'}
                      </div>
                      {sale.paymentAccountName && (
                        <Badge variant="outline" className="border-border bg-muted/50 text-[10px] shrink-0 font-medium">
                          {sale.paymentAccountName}
                        </Badge>
                      )}
                    </div>

                    {/* Footer Row: Total Value + Action buttons */}
                    <div className="flex justify-between items-center pt-1" onClick={() => setSelectedSale(sale)}>
                      <div className="text-xs text-muted-foreground">
                        Cotação: <span className="font-semibold">{formatCurrency(Number(sale.goldPrice))}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Valor Total</span>
                        <span className="font-black text-base text-emerald-500">
                          {formatCurrency(Number(sale.adjustment?.paymentReceivedBRL || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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

      {saleToEditObservation && (
        <EditObservationModal
          sale={saleToEditObservation}
          open={!!saleToEditObservation}
          onOpenChange={(open) => !open && setSaleToEditObservation(null)}
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

      {saleToApplyCommission && (
        <ApplyCommissionModal
          sale={saleToApplyCommission}
          open={!!saleToApplyCommission}
          onOpenChange={(open) => !open && setSaleToApplyCommission(null)}
          onSuccess={() => { fetchSales(); setSaleToApplyCommission(null); }}
        />
      )}

      {saleToUpdateShipping && (
        <UpdateShippingCostModal
          sale={saleToUpdateShipping}
          open={!!saleToUpdateShipping}
          onOpenChange={(open) => !open && setSaleToUpdateShipping(null)}
          onSave={fetchSales}
        />
      )}

    </div>
  );
}