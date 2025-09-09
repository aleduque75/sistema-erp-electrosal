"use client";

import { useEffect, useState, useCallback } from "react";
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
import { AccountPayForm } from "./components/account-pay-form"; // <-- CORRIGIDO AQUI
import { SplitAccountPayForm } from "./components/split-account-pay-form";
import { PayAccountForm } from "./components/pay-account-form"; // Added
import { formatInTimeZone } from "date-fns-tz";

interface AccountPay {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string | null;
  isInstallment?: boolean;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
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

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountPay | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountPay | null>(
    null
  );
  const [accountToPay, setAccountToPay] = useState<AccountPay | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [accountToSplit, setAccountToSplit] = useState<AccountPay | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!date?.from || !date?.to) return;
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        startDate: date.from.toISOString().split("T")[0],
        endDate: date.to.toISOString().split("T")[0],
      });
      const response = await api.get(`/accounts-pay?${params.toString()}`);
      setAccounts(response.data.accounts || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      toast.error("Falha ao carregar contas a pagar.");
    } finally {
      setIsFetching(false);
    }
  }, [date]);

  useEffect(() => {
    if (user && !loading) {
      fetchAccounts();
    }
  }, [user, loading, fetchAccounts]);

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
      accessorKey: "amount",
      header: () => <div className="text-right">Valor</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.getValue("amount"))}
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Contas a Pagar</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <DateRangePicker
              date={date}
              onDateChange={setDate}
              className="w-full sm:w-auto"
            />
            <Button onClick={handleOpenNewModal} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={accounts}
              filterColumnId="description"
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
              accountId={accountToPay.id}
              onSave={handlePaymentSave}
              initialAmount={accountToPay.amount}
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
    </>
  );
}
