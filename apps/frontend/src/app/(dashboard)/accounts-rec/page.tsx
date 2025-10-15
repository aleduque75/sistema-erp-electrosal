'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import { formatInTimeZone } from 'date-fns-tz';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { ReceivePaymentForm } from './components/receive-payment-form';
import { SaleDetailsView } from '../sales/components/SaleDetailsView';

// Interfaces
interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  received: boolean;
  receivedAt?: string | null;
  sale?: { id: string; orderNumber: number };
  pessoa?: { name: string }; // Assuming sale includes pessoa
}

interface SaleDetails extends AccountRec { /* Combine for simplicity */ }

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(new Date(dateString), userTimeZone, "dd/MM/yyyy");
};

export default function AccountsRecPage() {
  const [accounts, setAccounts] = useState<AccountRec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountToReceive, setAccountToReceive] = useState<AccountRec | null>(null);
  const [isViewSaleModalOpen, setIsViewSaleModalOpen] = useState(false);
  const [saleToView, setSaleToView] = useState<any | null>(null);

  // Filters State
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        const response = await api.get(`/accounts-rec?${params.toString()}`);
        setAccounts(response.data);
      } catch (err) {
        toast.error("Falha ao buscar contas a receber.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, [statusFilter]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const searchTerm = filter.toLowerCase();
      const matchesText = searchTerm === '' ||
        acc.description.toLowerCase().includes(searchTerm) ||
        (acc.sale?.orderNumber ? String(acc.sale.orderNumber).toLowerCase().includes(searchTerm) : false);

      const matchesDate = !dateRange || !dateRange.from || (
        new Date(acc.dueDate) >= dateRange.from &&
        (!dateRange.to || new Date(acc.dueDate) <= dateRange.to)
      );

      return matchesText && matchesDate;
    });
  }, [accounts, filter, dateRange]);

  const handleSavePayment = () => {
    setAccountToReceive(null);
    // Re-trigger fetch
    const currentFilter = statusFilter;
    setStatusFilter('REFETCH');
    setTimeout(() => setStatusFilter(currentFilter), 0);
  };

  const handleViewSale = async (saleId: string) => {
    if (!saleId) return;
    const promise = api.get(`/sales/${saleId}`);
    toast.promise(promise, {
      loading: "Buscando detalhes da venda...",
      success: (response) => {
        setSaleToView(response.data);
        setIsViewSaleModalOpen(true);
        return "Detalhes da venda carregados.";
      },
      error: "Falha ao carregar detalhes da venda.",
    });
  };

  const columns: ColumnDef<AccountRec>[] = [
    {
      accessorKey: "description",
      header: "Descrição",
    },
    {
      accessorKey: "sale.orderNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Pedido
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Vencimento
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "received",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.received ? "default" : "secondary"}>
          {row.original.received ? `Recebido em ${formatDate(row.original.receivedAt!)}` : "Pendente"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewSale(account.sale?.id!)} disabled={!account.sale}>Visualizar Venda</DropdownMenuItem>
              <DropdownMenuSeparator />
              {!account.received && (
                <DropdownMenuItem onClick={() => setAccountToReceive(account)}>Registrar Recebimento</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
        
        <div className="flex items-center gap-4">
            <Input 
              placeholder="Filtrar por descrição ou pedido..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
              </SelectContent>
            </Select>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
        </div>

        <Card>
            <CardContent className="pt-6">
                <DataTable columns={columns} data={filteredAccounts} />
            </CardContent>
        </Card>

        {/* Modal para Registrar Recebimento */}
        <Dialog open={!!accountToReceive} onOpenChange={(isOpen) => !isOpen && setAccountToReceive(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Recebimento</DialogTitle>
                </DialogHeader>
                {accountToReceive && <ReceivePaymentForm accountRec={accountToReceive} onSave={handleSavePayment} />}
            </DialogContent>
        </Dialog>

        {/* Modal para Visualizar a Venda */}
        <Dialog open={isViewSaleModalOpen} onOpenChange={setIsViewSaleModalOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Detalhes da Venda - Pedido #{saleToView?.orderNumber}</DialogTitle>
                </DialogHeader>
                {saleToView ? <SaleDetailsView sale={saleToView} onReceivePayment={setAccountToReceive} /> : <p>Carregando...</p>}
            </DialogContent>
        </Dialog>
    </div>
  );
}