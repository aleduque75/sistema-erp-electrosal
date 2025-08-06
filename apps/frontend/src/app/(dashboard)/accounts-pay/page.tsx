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

// Supondo que estes formulários existam em uma pasta 'components'
import { AccountPayForm } from "./components/pay-account-form";
import { PayAccountForm } from "./components/pay-account-form";
import { formatInTimeZone } from "date-fns-tz";

// Interface e Funções de Formatação
interface AccountPay {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string | null;
  isInstallment?: boolean;
  totalInstallments?: number;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

const formatDate = (dateString?: string | null) =>
  dateString
    ? formatInTimeZone(new Date(dateString), "UTC", "dd/MM/yyyy")
    : "N/A";

// Componente da Página
export default function AccountsPayPage() {
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

  const fetchAccounts = useCallback(async () => {
    if (!date?.from || !date?.to) return;

    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      params.append("startDate", date.from.toISOString().split("T")[0]);
      params.append("endDate", date.to.toISOString().split("T")[0]);

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
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSave = () => {
    setIsFormModalOpen(false);
    setAccountToEdit(null);
    fetchAccounts();
  };

  const handlePaymentSave = () => {
    setAccountToPay(null);
    fetchAccounts();
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/accounts-pay/${accountToDelete.id}`);
      toast.success("Conta excluída com sucesso!");
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir.");
    } finally {
      setAccountToDelete(null);
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
    </>
  );
}
