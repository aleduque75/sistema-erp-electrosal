'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MoreHorizontal, ArrowUpDown, RotateCcw } from 'lucide-react';
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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ReceivePaymentForm } from './components/receive-payment-form';
import { EditAccountRecForm } from './components/edit-account-rec-form';
import { SaleDetailsView } from './components/sale-details-view';

// Interfaces
interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  received: boolean;
  receivedAt?: string | null;
  sale?: { id: string; orderNumber: number; observation?: string | null; createdAt?: string };
  pessoa?: { name: string };
  clientId: string;
  saleInstallments?: any[];
}

interface SaleDetails extends AccountRec { /* Combine for simplicity */ }

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(new Date(dateString), userTimeZone, "dd/MM/yyyy");
};

export default function AccountsRecPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountRec[]>([]);
  const [loading, setIsPageLoading] = useState(true);
  const [accountToReceive, setAccountToReceive] = useState<AccountRec | null>(null);
  const [isViewSaleModalOpen, setIsViewSaleModalOpen] = useState(false);
  const [saleToView, setSaleToView] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountRec | null>(null);

  // Filters State
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchAccounts = async () => {
    setIsPageLoading(true);
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
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
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
    fetchAccounts();
  };

  const handleSaveEdit = () => {
    setIsEditModalOpen(false);
    setAccountToEdit(null);
    fetchAccounts();
  };

  const handleEdit = (account: AccountRec) => {
    setAccountToEdit(account);
    setIsEditModalOpen(true);
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
          {row.original.received ? `Recebido em ${formatDate(row.original.dueDate!)}` : "Pendente"}
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
              <DropdownMenuItem onClick={() => handleEdit(account)}>Editar</DropdownMenuItem>
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
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        <Button variant="ghost" size="icon" onClick={fetchAccounts} title="Atualizar lista">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="hidden md:block">
            <DataTable columns={columns} data={filteredAccounts} />
          </div>

          <div className="md:hidden space-y-2 max-w-md mx-auto">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground animate-pulse italic">Carregando...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground italic">Nenhuma conta encontrada.</div>
            ) : (
              filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-3 rounded-xl border border-border bg-card shadow-sm space-y-2 active:scale-[0.98] transition-transform"
                  onClick={() => account.sale?.id && handleViewSale(account.sale.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider line-clamp-1">
                        {account.pessoa?.name || (account.sale?.orderNumber ? `Pedido #${account.sale.orderNumber}` : "N/A")}
                      </span>
                      <span className="font-bold text-sm text-foreground line-clamp-1">{account.description}</span>
                    </div>
                    <Badge variant={account.received ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-5">
                      {account.received ? "Recebido" : "Pendente"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">Venc: {formatDate(account.dueDate)}</span>
                      <span className="text-sm font-black text-zinc-900">
                        {formatCurrency(account.amount)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          {account.sale?.id && (
                            <DropdownMenuItem onClick={() => handleViewSale(account.sale!.id)}>
                              Visualizar Venda
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(account)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!account.received && (
                            <DropdownMenuItem onClick={() => setAccountToReceive(account)}>
                              Registrar Recebimento
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para Registrar Recebimento */}
      <Dialog open={!!accountToReceive} onOpenChange={(isOpen) => !isOpen && setAccountToReceive(null)}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2">
            {accountToReceive && <ReceivePaymentForm accountRec={accountToReceive} onSave={handleSavePayment} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Conta a Receber */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta a Receber</DialogTitle>
          </DialogHeader>
          {accountToEdit && <EditAccountRecForm accountRec={accountToEdit} onSave={handleSaveEdit} />}
        </DialogContent>
      </Dialog>

      {/* Modal para Visualizar a Venda */}
      <Dialog open={isViewSaleModalOpen} onOpenChange={setIsViewSaleModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda - Pedido #{saleToView?.orderNumber}</DialogTitle>
          </DialogHeader>
          {saleToView ? <SaleDetailsView sale={saleToView} onReceivePayment={setAccountToReceive} onUpdate={() => handleViewSale(saleToView.id)} /> : <p>Carregando...</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}