"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  DollarSign,
  Edit,
  Trash2,
  PlusCircle,
  GitCommitHorizontal,
  Info,
  RotateCcw,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountPayForm } from "./components/account-pay-form"; // <-- CORRIGIDO AQUI
import { SplitAccountPayForm } from "./components/split-account-pay-form";
import { PayAccountForm } from "./components/pay-account-form"; // Added
import { AccountPayDetailsView } from "./components/account-pay-details-view";
import { formatInTimeZone } from "date-fns-tz";

interface AccountPay {
  id: string;
  description: string;
  amount: number;
  goldAmount?: number | null;
  goldPrice?: number | null;
  dueDate: string;
  paid: boolean;
  paidAt?: string | null;
  isInstallment?: boolean;
  createdAt: string; // Adicionado
  fornecedorId?: string | null;
  fornecedor?: {
    pessoa: {
      name: string;
    };
  } | null;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatGrams = (value?: number | null) =>
  value ? `${Number(value).toFixed(4)}g` : "N/A";

const formatDate = (dateString?: string | null) =>
  dateString
    ? formatInTimeZone(new Date(dateString), "UTC", "dd/MM/yyyy")
    : "N/A";

export default function AccountsPayPage() {
  const { user, loading } = useAuth();
  const [accounts, setAccounts] = useState<AccountPay[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountPay | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountPay | null>(
    null
  );
  const [accountToPay, setAccountToPay] = useState<AccountPay | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [accountToSplit, setAccountToSplit] = useState<AccountPay | null>(null);
  const [accountToView, setAccountToView] = useState<AccountPay | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!date?.from || !date?.to) return;
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        startDate: date.from.toISOString().split("T")[0],
        endDate: date.to.toISOString().split("T")[0],
      });
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await api.get(`/accounts-pay?${params.toString()}`);
      setAccounts(response.data.accounts || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      toast.error("Falha ao carregar contas a pagar.");
    } finally {
      setIsFetching(false);
    }
  }, [date, statusFilter]);

  useEffect(() => {
    if (user && !loading) {
      fetchAccounts();
    }
  }, [user, loading, fetchAccounts, statusFilter]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const searchTerm = filter.toLowerCase();
      return searchTerm === '' || acc.description.toLowerCase().includes(searchTerm);
    });
  }, [accounts, filter]);

  const handleSave = () => {
    setIsFormModalOpen(false);
    setAccountToEdit(null);
    fetchAccounts();
  };

  const handlePaymentSave = () => {
    setAccountToPay(null);
    fetchAccounts();
  };

  const handleSplitSave = async (numberOfInstallments: number) => {
    if (!accountToSplit) return;
    try {
      await api.post(`/accounts-pay/${accountToSplit.id}/split`, {
        numberOfInstallments,
      });
      toast.success("Conta parcelada com sucesso!");
      setIsSplitModalOpen(false);
      setAccountToSplit(null);
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao parcelar a conta.");
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/accounts-pay/${accountToDelete.id}`);
      toast.success("Conta excluída com sucesso!");
      setAccountToDelete(null);
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir.");
    }
  };

  const handleOpenNewModal = () => {
    setAccountToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (account: AccountPay) => {
    setAccountToEdit(account);
    setIsFormModalOpen(true);
  };

  const columns: ColumnDef<AccountPay>[] = [
    { accessorKey: "description", header: "Descrição" },
    {
      accessorKey: "fornecedor.pessoa.name",
      header: "Fornecedor",
      cell: ({ row }) => row.original.fornecedor?.pessoa?.name || "N/A",
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Valor (BRL)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.getValue("amount"))}
        </div>
      ),
    },
    {
      accessorKey: "goldAmount",
      header: () => <div className="text-right">Equiv. Ouro (AU)</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatGrams(row.original.goldAmount)}
        </div>
      ),
    },
    {
      accessorKey: "goldPrice",
      header: () => <div className="text-right">Cotação</div>,
      cell: ({ row }) => (
        <div className="text-right text-muted-foreground text-xs">
          {row.original.goldPrice ? formatCurrency(row.original.goldPrice) : "-"}
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }) => formatDate(row.getValue("dueDate")),
    },
    {
      accessorKey: "paid",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.paid ? "default" : "secondary"}>
          {row.original.paid
            ? `Pago em ${formatDate(row.original.paidAt)}`
            : "Pendente"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setAccountToView(account)}>
                  <Info className="mr-2 h-4 w-4" /> Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={account.paid}
                  onClick={() => setAccountToPay(account)}
                >
                  <DollarSign className="mr-2 h-4 w-4" /> Registrar Pagamento
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={account.paid}
                  onClick={() => handleOpenEditModal(account)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={account.paid || account.isInstallment}
                  onClick={() => {
                    setAccountToSplit(account);
                    setIsSplitModalOpen(true);
                  }}
                >
                  <GitCommitHorizontal className="mr-2 h-4 w-4" /> Quebrar em
                  Parcelas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setAccountToDelete(account)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (loading) return <p className="text-center p-10">Carregando...</p>;

  return (
    <>
      <div className="space-y-4 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Contas a Pagar</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button onClick={handleOpenNewModal} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <Input 
              placeholder="Filtrar por descrição..."
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
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker date={date} onDateChange={setDate} />
            <Button variant="ghost" size="icon" onClick={() => fetchAccounts()} title="Atualizar lista">
              <RotateCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={filteredAccounts}
              isLoading={isFetching}
            />
          </CardContent>
          <CardFooter className="font-bold text-lg justify-end">
            Total Pendente no Período: {formatCurrency(total)}
          </CardFooter>
        </Card>
      </div>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={accountToEdit ? "Editar Conta" : "Nova Conta"}
        description="Preencha os detalhes da conta."
      >
        <AccountPayForm account={accountToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{accountToDelete?.description}"?
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
        open={!!accountToPay}
        onOpenChange={(open) => !open && setAccountToPay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Pagamento para "{accountToPay?.description}".
            </DialogDescription>
          </DialogHeader>
          {accountToPay && (
            <PayAccountForm
              account={accountToPay}
              onSave={handlePaymentSave}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSplitModalOpen} onOpenChange={setIsSplitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quebrar Conta em Parcelas</DialogTitle>
            <DialogDescription>
              Dividir "{accountToSplit?.description}" (Valor:{" "}
              {formatCurrency(accountToSplit?.amount)}) em múltiplas parcelas.
            </DialogDescription>
          </DialogHeader>
          {accountToSplit && <SplitAccountPayForm onSave={handleSplitSave} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!accountToView} onOpenChange={(open) => !open && setAccountToView(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta a Pagar</DialogTitle>
            <DialogDescription>{accountToView?.description}</DialogDescription>
          </DialogHeader>
          {accountToView && <AccountPayDetailsView account={accountToView} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
