"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, DollarSign, Edit, Trash2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
import { AccountPayForm } from "./account-pay-form";
import { PayAccountForm } from "./pay-account-form";

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

export default function AccountsPayPage() {
  const { user, loading } = useAuth();
  const [accounts, setAccounts] = useState<AccountPay[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [accountToPay, setAccountToPay] = useState<AccountPay | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountPay | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountPay | null>(
    null
  );

  const fetchAccounts = async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/accounts-pay");
      setAccounts(
        response.data.map((acc: any) => ({
          ...acc,
          amount: parseFloat(acc.amount),
        }))
      );
    } catch (err) {
      toast.error("Falha ao carregar contas a pagar.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !loading) fetchAccounts();
  }, [user, loading]);

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchAccounts();
  };

  // <<< PASSO 1: ADICIONE ESTA FUNÇÃO
  const handlePaymentSave = () => {
    setAccountToPay(null); // Fecha o modal de pagamento
    fetchAccounts(); // Atualiza a lista de contas
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/accounts-pay/${accountToDelete.id}`);
      toast.success("Conta excluída com sucesso!");
      setAccounts(accounts.filter((acc) => acc.id !== accountToDelete.id));
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

  return (
    <>
      <Card className="mx-auto my-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Contas a Pagar</CardTitle>
            <Button onClick={handleOpenNewModal}>Nova Conta a Pagar</Button>
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
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={accountToEdit ? "Editar Conta" : "Nova Conta"}
        description="Preencha os detalhes da conta para registrar uma nova despesa."
      >
        <AccountPayForm account={accountToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!accountToDelete}
        onOpenChange={(open) => {
          if (!open) setAccountToDelete(null);
        }}
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

      {/* <<< PASSO 2: ADICIONE ESTE MODAL DE PAGAMENTO */}
      <Dialog
        open={!!accountToPay}
        onOpenChange={(open) => {
          if (!open) setAccountToPay(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Selecione a conta e a data para registrar o pagamento de "
              {accountToPay?.description}".
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
