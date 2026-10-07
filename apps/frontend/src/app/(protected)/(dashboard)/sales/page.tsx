'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MoreHorizontal, PlusCircle, ArrowUpDown, Printer, RotateCcw, Truck, Copy, Filter, SlidersHorizontal, ChevronDown, ChevronUp, Search, X, LayoutList, LayoutGrid, Coins, Sparkles } from 'lucide-react';
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
    PENDENTE: {
      label: 'Pendente',
      className: 'text-amber-500 bg-amber-500/10 border-amber-500/30 dark:text-amber-400 dark:bg-amber-400/10',
    },
    CONFIRMADO: {
      label: 'Confirmado',
      className: 'text-blue-500 bg-blue-500/10 border-blue-500/30 dark:text-blue-400 dark:bg-blue-400/10',
    },
    A_SEPARAR: {
      label: 'A Separar',
      className: 'text-orange-500 bg-orange-500/10 border-orange-500/30 dark:text-orange-400 dark:bg-orange-400/10',
    },
    SEPARADO: {
      label: 'Separado',
      className: 'text-purple-500 bg-purple-500/10 border-purple-500/30 dark:text-purple-400 dark:bg-purple-400/10',
    },
    FINALIZADO: {
      label: 'Finalizado',
      className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-400/10',
    },
    CANCELADO: {
      label: 'Cancelado',
      className: 'text-rose-500 bg-rose-500/10 border-rose-500/30 dark:text-rose-400 dark:bg-rose-400/10',
    },
    PAGO_PARCIALMENTE: {
      label: 'Pago Parcial',
      className: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30 dark:text-cyan-400 dark:bg-cyan-400/10',
    },
  };

  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setIsPageLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
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

  const quickStatusTabs = [
    { key: '', label: 'Todos' },
    { key: 'PENDENTE', label: 'Pendentes' },
    { key: 'A_SEPARAR', label: 'A Separar' },
    { key: 'SEPARADO', label: 'Separados' },
    { key: 'FINALIZADO', label: 'Finalizados' },
    { key: 'CANCELADO', label: 'Cancelados' },
  ];

  const handleQuickStatus = (statusKey: string) => {
    const updated = { ...filters, status: statusKey };
    setFilters(updated);
    setPage(1);
    fetchSales(updated, 1);
  };

  const renderPaymentBadge = (sale: Sale) => {
    const isMetal = 
      sale.paymentAccountName?.toUpperCase().includes('METAL') || 
      sale.paymentMethod === 'METAL';
    const paymentText = sale.paymentAccountName || sale.paymentMethod?.replace('_', ' ') || 'N/A';

    if (isMetal) {
      const label = sale.paymentAccountName && sale.paymentAccountName !== 'N/A' && sale.paymentAccountName !== 'A COMBINAR'
        ? sale.paymentAccountName 
        : 'METAL';
      return (
        <Badge
          variant="outline"
          className="border-amber-500/50 bg-amber-500/15 text-amber-500 dark:text-amber-400 font-extrabold text-[10px] px-2 py-0.5 inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <Coins className="h-3 w-3 text-amber-400" />
          <span>{label}</span>
        </Badge>
      );
    }

    if (sale.paymentAccountName) {
      return (
        <Badge
          variant="outline"
          className="border-blue-500/40 bg-blue-500/10 text-blue-500 dark:text-blue-400 font-bold text-[10px] px-2 py-0.5 whitespace-nowrap"
        >
          {sale.paymentAccountName}
        </Badge>
      );
    }

    if (sale.paymentMethod === 'A_COMBINAR') {
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-semibold text-[10px] px-2 py-0.5 whitespace-nowrap"
        >
          A COMBINAR
        </Badge>
      );
    }

    if (sale.paymentMethod === 'A_PRAZO') {
      return (
        <Badge
          variant="outline"
          className="border-purple-500/40 bg-purple-500/10 text-purple-500 dark:text-purple-400 font-semibold text-[10px] px-2 py-0.5 whitespace-nowrap"
        >
          A PRAZO
        </Badge>
      );
    }

    if (sale.paymentMethod === 'A_VISTA') {
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-semibold text-[10px] px-2 py-0.5 whitespace-nowrap"
        >
          À VISTA
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="border-border/60 bg-muted/40 text-muted-foreground font-medium text-[10px] px-2 py-0.5 whitespace-nowrap"
      >
        {paymentText}
      </Badge>
    );
  };

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

  const handleDeleteSale = async (sale: Sale) => {
    if (!confirm(`Deseja realmente EXCLUIR a venda #${sale.orderNumber}? Esta ação excluirá o registro e LIBERARÁ o número #${sale.orderNumber} para usar em outra venda.`)) return;
    try {
      await api.delete(`/sales/${sale.id}`);
      toast.success(`Venda #${sale.orderNumber} excluída com sucesso! O número #${sale.orderNumber} está livre.`);
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao excluir venda.');
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
    {
      accessorKey: 'orderNumber',
      header: 'Nº Pedido',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setSelectedSale(row.original)}
          className="font-mono font-bold text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
          title="Ver detalhes do pedido"
        >
          #{row.original.orderNumber}
        </button>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status] || { label: status, className: '' };
        return (
          <Badge variant="outline" className={`border ${config.className} font-semibold text-xs whitespace-nowrap`}>
            {config.label}
          </Badge>
        );
      },
    },
    { 
      accessorKey: 'pessoa.name', 
      header: 'Cliente',
      cell: ({ row }) => (
        <div 
          onClick={() => setSelectedSale(row.original)}
          className="font-medium text-xs sm:text-sm text-foreground hover:text-primary cursor-pointer line-clamp-1 max-w-[200px]"
          title={row.original.pessoa?.name}
        >
          {row.original.pessoa?.name || 'Cliente desconhecido'}
        </div>
      ),
    },
    {
      id: 'products',
      header: 'Produtos',
      cell: ({ row }) => {
        const saleItems = row.original.saleItems;
        if (!saleItems || saleItems.length === 0) {
          return <span className="text-muted-foreground text-xs italic">-</span>;
        }
        return (
          <div className="flex flex-col gap-0.5 max-w-[220px]">
            {saleItems.map(item => (
              <span key={item.id} className="text-xs text-foreground/90 truncate">
                {item.product?.name || 'Produto'} <span className="font-semibold text-muted-foreground">({Number(Number(item.quantity).toFixed(2))})</span>
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Data',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Pagamento',
      cell: ({ row }) => renderPaymentBadge(row.original),
    },
    {
      accessorKey: 'goldPrice',
      header: () => <div className="text-right">Cotação</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-xs sm:text-sm whitespace-nowrap">
          {formatCurrency(Number(row.original.goldPrice))}
        </div>
      ),
    },
    {
      accessorKey: 'adjustment',
      header: () => <div className="text-right">Lucro (g)</div>,
      cell: ({ row }) => {
        const profit = row.original.adjustment ? Number(row.original.adjustment.netDiscrepancyGrams) : null;
        if (profit === null || isNaN(profit)) {
          return <div className="text-right font-mono text-xs text-muted-foreground">-</div>;
        }
        const isPositive = profit > 0;
        const isNegative = profit < 0;
        return (
          <div className={`text-right font-mono text-xs font-bold whitespace-nowrap ${
            isPositive ? 'text-emerald-500 dark:text-emerald-400' : isNegative ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground'
          }`}>
            {isPositive ? `+${profit.toFixed(4)}g` : `${profit.toFixed(4)}g`}
          </div>
        );
      },
    },
    {
      accessorKey: 'netAmount',
      header: () => <div className="text-right">Valor Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-xs sm:text-sm text-emerald-500 dark:text-emerald-400 whitespace-nowrap">
          {formatCurrency(Number(row.original.netAmount ?? row.original.totalAmount ?? 0))}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const sale = row.original;
        // REGRA FINAL: Reverter pesado só aparece se a venda foi CONFIRMADA ou FINALIZADA (lotes baixados e financeiro gerado)
        const isRevertible = sale.status === 'CONFIRMADO' || sale.status === 'FINALIZADO';

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
                    <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSale(sale.id)}>Cancelar Venda</DropdownMenuItem>
                  </>
                )}

                {/* Ações para A_SEPARAR */}
                {sale.status === 'A_SEPARAR' && (
                  <DropdownMenuItem onClick={() => handleSeparateSale(sale.id)}>Marcar como Separado</DropdownMenuItem>
                )}

                {/* Ações para SEPARADO */}
                {sale.status === 'SEPARADO' && (
                  <DropdownMenuItem onClick={() => setSaleToConfirm(sale)}>
                    Confirmar Venda
                  </DropdownMenuItem>
                )}

                {/* Ações para A_SEPARAR ou SEPARADO (Voltar para Pendente) */}
                {(sale.status === 'A_SEPARAR' || sale.status === 'SEPARADO') && (
                  <DropdownMenuItem onClick={() => handleRevertSale(sale.id)}>
                    Voltar para Pendente
                  </DropdownMenuItem>
                )}

                {/* Ações para CANCELADO */}
                {sale.status === 'CANCELADO' && (
                  <>
                    <DropdownMenuItem onClick={() => handleRevertSale(sale.id)}>
                      Reativar / Voltar para Pendente
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 font-semibold" onClick={() => handleDeleteSale(sale)}>
                      Excluir Venda (Liberar Nº #{sale.orderNumber})
                    </DropdownMenuItem>
                  </>
                )}

                {/* Ações para CONFIRMADO ou FINALIZADO */}
                {isRevertible && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 font-semibold" onClick={() => handleRevertSale(sale.id)}>
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
    <div className="space-y-4 p-2 sm:p-4 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Vendas</h1>
            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground border-border/50">
              {(total || 0).toLocaleString('pt-BR')} {total === 1 ? 'registro' : 'registros'}
            </Badge>
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border/80"
              onClick={() => fetchSales()}
              title="Atualizar lista"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              className="h-9 px-3.5 rounded-xl font-semibold gap-1.5 shadow-sm text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsNewSaleModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nova Venda</span>
            </Button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => fetchSales()}
            title="Atualizar lista"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            className="h-9 px-4 rounded-xl font-semibold gap-2 shadow-sm text-sm"
            onClick={() => setIsNewSaleModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nova Venda</span>
          </Button>
        </div>
      </div>

      {/* Global New Sale Modal Dialog */}
      <Dialog open={isNewSaleModalOpen} onOpenChange={setIsNewSaleModalOpen}>
        <DialogContent className="w-full h-[100dvh] sm:w-[98vw] sm:max-w-[1440px] sm:h-[95dvh] sm:max-h-[960px] p-2 sm:p-5 flex flex-col overflow-hidden">
          <DialogHeader className="pb-2 border-b shrink-0">
            <DialogTitle className="text-base sm:text-xl font-bold flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              Registrar Nova Venda
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 pt-2">
            <NewSaleForm onSave={handleSaveSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop Filters */}
      <Card className="hidden md:block border-border/80 shadow-sm">
        <CardHeader className="py-3 px-6">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-1">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground font-medium">Data Inicial</Label>
              <Input id="startDate" type="date" className="h-9 text-xs" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground font-medium">Data Final</Label>
              <Input id="endDate" type="date" className="h-9 text-xs" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orderNumber" className="text-xs text-muted-foreground font-medium">Nº Pedido ou Cliente</Label>
              <Input id="orderNumber" type="text" placeholder="Buscar pedido ou cliente..." className="h-9 text-xs" value={filters.orderNumber} onChange={e => handleFilterChange('orderNumber', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Cliente</Label>
              <Combobox options={clients} value={filters.clientId ?? ''} onChange={value => handleFilterChange('clientId', value || '')} placeholder="Selecione um cliente..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Status</Label>
              <Select value={filters.status || 'ALL'} onValueChange={value => handleFilterChange('status', value === 'ALL' ? '' : value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione um status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 col-span-1 md:col-span-2 lg:col-span-5 justify-end pt-1">
              <Button type="submit" size="sm" className="h-9 px-4 text-xs font-semibold">
                Filtrar
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-9 px-4 text-xs" onClick={handleClearFilters}>
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Mobile Search & Filter Bar */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center gap-2">
          <form onSubmit={handleFilterSubmit} className="flex-1 relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar pedido ou cliente..."
              value={filters.orderNumber}
              onChange={e => handleFilterChange('orderNumber', e.target.value)}
              className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-card border-border/80 shadow-sm rounded-xl focus-visible:ring-1"
            />
            {filters.orderNumber && (
              <button
                type="button"
                onClick={() => {
                  const updated = { ...filters, orderNumber: '' };
                  setFilters(updated);
                  setPage(1);
                  fetchSales(updated, 1);
                }}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
          <Button
            type="button"
            variant={isMobileFilterOpen || activeFilterCount > 0 ? "default" : "outline"}
            className="h-10 px-3.5 gap-1.5 relative shadow-sm rounded-xl shrink-0"
            onClick={() => setIsMobileFilterOpen(prev => !prev)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs font-semibold">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-primary text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
            {isMobileFilterOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Collapsible Mobile Filter Panel */}
        {isMobileFilterOpen && (
          <Card className="p-4 space-y-3 bg-card border border-border/80 shadow-lg rounded-2xl animate-in fade-in-50 slide-in-from-top-2 duration-200">
            <form onSubmit={(e) => { handleFilterSubmit(e); setIsMobileFilterOpen(false); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="mobileStartDate" className="text-xs font-medium text-muted-foreground">Data Inicial</Label>
                  <Input id="mobileStartDate" type="date" className="h-9 text-xs rounded-lg" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mobileEndDate" className="text-xs font-medium text-muted-foreground">Data Final</Label>
                  <Input id="mobileEndDate" type="date" className="h-9 text-xs rounded-lg" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Cliente</Label>
                <Combobox options={clients} value={filters.clientId ?? ''} onChange={value => handleFilterChange('clientId', value || '')} placeholder="Selecione um cliente..." />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <Select value={filters.status || 'ALL'} onValueChange={value => handleFilterChange('status', value === 'ALL' ? '' : value)}>
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os status</SelectItem>
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1 h-9 text-xs font-bold rounded-lg">
                  Aplicar Filtros
                </Button>
                <Button type="button" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => { handleClearFilters(); setIsMobileFilterOpen(false); }}>
                  Limpar
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Quick Status Tabs + View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Horizontal scrollable status pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickStatusTabs.map((tab) => {
            const isActive = (filters.status || '') === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleQuickStatus(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle (Table vs Cards) - for desktop and tablet */}
        <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 shrink-0 self-end sm:self-auto">
          <Button
            type="button"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 rounded-lg text-xs gap-1.5 font-medium"
            onClick={() => setViewMode('table')}
            title="Visualização em Tabela"
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Tabela</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 rounded-lg text-xs gap-1.5 font-medium"
            onClick={() => setViewMode('cards')}
            title="Visualização em Cards"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Cards</span>
          </Button>
        </div>
      </div>

      {/* Sub-header: Bulk Actions or Counter */}
      <div className="flex items-center justify-between gap-2 px-1">
        {Object.keys(rowSelection).length > 0 ? (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleBulkConfirm} className="h-8 text-xs font-semibold rounded-lg">
              Confirmar {Object.keys(rowSelection).length} Venda(s)
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyAsText} className="h-8 text-xs rounded-lg">
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copiar
            </Button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground font-medium">
            Exibindo <strong>{(sales || []).length}</strong> de <strong>{(total || 0).toLocaleString('pt-BR')}</strong> vendas
          </div>
        )}

        <div className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
          Pág {page} de {Math.ceil((total || 0) / limit) || 1}
        </div>
      </div>

      <Card className="border-none md:border md:border-border/80 md:shadow-sm bg-transparent md:bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-0 md:p-6 space-y-4">
          {/* Desktop & Tablet Table View */}
          <div className={viewMode === 'table' ? 'hidden md:block' : 'hidden'}>
            <div className="overflow-x-auto min-w-full rounded-xl border border-border/80">
              <DataTable
                columns={columns}
                data={sales}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </div>
          </div>

          {/* Cards View (default on mobile, toggleable on tablet & desktop) */}
          <div className={viewMode === 'cards' ? 'block' : 'md:hidden'}>
            {loading ? (
              <div className="py-16 text-center text-muted-foreground italic text-sm">Carregando vendas...</div>
            ) : sales.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground italic text-sm">Nenhuma venda encontrada.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {sales.map((sale, idx) => {
                  const config = statusConfig[sale.status] || { label: sale.status, className: '' };
                  const saleItems = sale.saleItems || [];
                  const isRevertible = sale.status === 'CONFIRMADO' || sale.status === 'FINALIZADO';
                  const totalCalculated = sale.netAmount ?? sale.totalAmount ?? 0;
                  const profit = sale.adjustment ? Number(sale.adjustment.netDiscrepancyGrams) : null;

                  return (
                    <div
                      key={sale.id}
                      className="p-4 rounded-2xl border border-border/80 bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all relative space-y-3 flex flex-col justify-between"
                    >
                      {/* Top Header: Checkbox + Pedido + Data + Status + Menu */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Checkbox
                              checked={rowSelection[idx] || false}
                              className="h-4 w-4 rounded border-muted-foreground/40 shrink-0"
                              onCheckedChange={(checked) => {
                                setRowSelection(prev => ({
                                  ...prev,
                                  [idx]: !!checked
                                }));
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedSale(sale)}
                              className="text-xs font-black tracking-wide text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md font-mono transition-colors"
                              title="Ver detalhes do pedido"
                            >
                              #{sale.orderNumber}
                            </button>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {formatDate(sale.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className={`border ${config.className} text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap`}>
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
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSale(sale.id)}>Cancelar Venda</DropdownMenuItem>
                                  </>
                                )}
                                {sale.status === 'A_SEPARAR' && (
                                  <DropdownMenuItem onClick={() => handleSeparateSale(sale.id)}>Marcar como Separado</DropdownMenuItem>
                                )}
                                {sale.status === 'SEPARADO' && (
                                  <DropdownMenuItem onClick={() => setSaleToConfirm(sale)}>Confirmar Venda</DropdownMenuItem>
                                )}
                                {(sale.status === 'A_SEPARAR' || sale.status === 'SEPARADO') && (
                                  <DropdownMenuItem onClick={() => handleRevertSale(sale.id)}>Voltar para Pendente</DropdownMenuItem>
                                )}
                                {sale.status === 'CANCELADO' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleRevertSale(sale.id)}>
                                      Reativar / Voltar para Pendente
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 font-semibold" onClick={() => handleDeleteSale(sale)}>
                                      Excluir Venda (Liberar Nº #{sale.orderNumber})
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {isRevertible && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 font-semibold" onClick={() => handleRevertSale(sale.id)}>
                                      Reverter para Pendente
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Client Name */}
                        <div className="cursor-pointer" onClick={() => setSelectedSale(sale)}>
                          <h3 className="font-semibold text-sm sm:text-base text-foreground tracking-tight line-clamp-1 hover:text-primary transition-colors">
                            {sale.pessoa?.name || 'Cliente não identificado'}
                          </h3>
                        </div>

                        {/* Products Pills List */}
                        <div className="cursor-pointer space-y-1" onClick={() => setSelectedSale(sale)}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {saleItems.length > 0 ? (
                              saleItems.map((item, i) => {
                                const qty = Number(item.quantity || 0);
                                const formattedQty = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(qty);
                                return (
                                  <span
                                    key={item.id || i}
                                    className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-lg bg-secondary text-secondary-foreground font-medium border border-border/40"
                                  >
                                    <span>{item.product?.name || 'Produto'}</span>
                                    <span className="ml-1 font-bold opacity-80">({formattedQty})</span>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sem itens</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Info: Payment & Lucro, followed by Cotação and Total Amount */}
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Pagamento:</span>
                            {renderPaymentBadge(sale)}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Lucro:</span>
                            {profit !== null && !isNaN(profit) ? (
                              <span className={`font-mono text-xs font-bold ${
                                profit > 0 ? 'text-emerald-500 dark:text-emerald-400' : profit < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground'
                              }`}>
                                {profit > 0 ? `+${profit.toFixed(4)}g` : `${profit.toFixed(4)}g`}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">-</span>
                            )}
                          </div>
                        </div>

                        <div
                          className="pt-2 border-t border-border/40 flex items-center justify-between cursor-pointer"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                              Cotação Au
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {formatCurrency(Number(sale.goldPrice))}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                              Valor Total
                            </span>
                            <span className="font-black text-sm sm:text-base text-emerald-500 dark:text-emerald-400">
                              {formatCurrency(Number(totalCalculated))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer Controls (Mobile & Desktop) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-4 px-1 border-t border-border/40">
            <div className="text-xs text-muted-foreground font-medium">
              Página <strong>{page}</strong> de <strong>{Math.ceil((total || 0) / limit) || 1}</strong>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-semibold rounded-xl"
                onClick={() => {
                  setPage(prev => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page <= 1 || loading}
              >
                Anterior
              </Button>
              <div className="text-xs font-bold px-2.5 py-1.5 bg-muted rounded-lg">
                {page} / {Math.ceil((total || 0) / limit) || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-semibold rounded-xl"
                onClick={() => {
                  setPage(prev => prev + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page >= Math.ceil((total || 0) / limit) || loading}
              >
                Próximo
              </Button>
            </div>
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