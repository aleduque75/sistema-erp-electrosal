"use client";

// Imports do React e bibliotecas
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, DollarSign, Edit, Trash2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

// Imports de Componentes UI
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

// Imports de Componentes do Módulo
import { AccountPayForm } from "./account-pay-form";
import { PayAccountForm } from "./pay-account-form";
import { CategoryChart } from "@/components/charts/category-chart";

// Interface e Funções de Formatação
interface AccountPay {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  isInstallment?: boolean;
  totalInstallments?: number;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

const formatDate = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : "N/A";

// Componente da Página
export default function AccountsPayPage() {
  // Estados de Autenticação e Carregamento
  const { user, loading } = useAuth();

  // Estados dos Dados
  const [accounts, setAccounts] = useState<AccountPay[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Estados para controlar os Modais (Dialogs)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountPay | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountPay | null>(
    null
  );
  const [accountToPay, setAccountToPay] = useState<AccountPay | null>(null);

  // Função para buscar os dados, agora "memorizada" com useCallback para evitar loops
  const fetchAccounts = useCallback(async () => {
    if (!date?.from || !date?.to) return; // Não busca se a data não estiver completa

    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      params.append("startDate", date.from.toISOString().split("T")[0]);
      params.append("endDate", date.to.toISOString().split("T")[0]);

      const response = await api.get(`/accounts-pay?${params.toString()}`);

      setAccounts(
        response.data.accounts.map((acc: any) => ({
          ...acc,
          amount: parseFloat(acc.amount),
        }))
      );
      setTotal(response.data.total);
    } catch (err) {
      toast.error("Falha ao carregar contas a pagar.");
      console.error("Erro ao buscar contas:", err);
    } finally {
      setIsFetching(false);
    }
  }, [date]); // A função só é recriada quando o `date` muda

  // useEffect principal que reage a mudanças e chama a busca de dados
  useEffect(() => {
    if (user && !loading) {
      fetchAccounts();
    }
  }, [user, loading, fetchAccounts]); // Depende da função memoizada

  // Funções "Handler" para interações do usuário
  const handleSave = () => {
    setIsFormModalOpen(false);
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
      fetchAccounts(); // Busca os dados novamente para atualizar a lista e o total
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

  // Definição das colunas da tabela
  const columns: ColumnDef<AccountPay>[] = [
    { accessorKey: "description", header: "Descrição" },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => formatCurrency(row.getValue("amount")),
    },
    {
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }) => formatDate(row.getValue("dueDate")),
    },
    {
      accessorKey: "paid",
      header: "Status",
      cell: ({ row }) => (row.getValue("paid") ? "Pago" : "Pendente"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
                onClick={() => setAccountToDelete(account)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) return <p className="text-center p-10">Carregando...</p>;

  // Renderização do componente
  return (
    <>
      <div className="mb-8">
        <CategoryChart />
      </div>

      <Card className="mx-auto my-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle>Contas a Pagar</CardTitle>
            <div className="flex items-center gap-2">
              <DateRangePicker date={date} onDateChange={setDate} />
              <Button onClick={handleOpenNewModal}>Nova Conta</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p className="text-center p-10">Buscando dados...</p>
          ) : (
            <DataTable
              columns={columns}
              data={accounts}
              filterColumnId="description"
              filterPlaceholder="Pesquisar por descrição..."
            />
          )}
        </CardContent>
        <CardFooter className="font-bold text-lg justify-end">
          Total do Período: {formatCurrency(total)}
        </CardFooter>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={accountToEdit ? "Editar Conta" : "Nova Conta"}
        description="Preencha os detalhes da conta."
      >
        <AccountPayForm
          account={
            accountToEdit
              ? {
                  ...accountToEdit,
                  // Garante que isInstallment seja sempre boolean
                  isInstallment: accountToEdit.isInstallment ?? false,
                }
              : null
          }
          onSave={handleSave}
        />
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
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
