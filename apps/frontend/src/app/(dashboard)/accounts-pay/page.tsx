"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  DollarSign,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Eye,
  PlusCircle,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { AccountPayForm } from "./account-pay-form"; // Assumindo que este formulário existe
import { TransacaoForm } from "../contas-correntes/transacao-form"; // Reutilizando o formulário de transação

interface AccountPay {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string | null;
  isInstallment?: boolean;
  totalInstallments?: number;
  currentInstallmentNumber?: number;
  contaCorrente?: {
    nome: string;
  } | null;
}
interface ContaCorrente {
  id: string;
  nome: string;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : "N/A";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | boolean | null;
}) => {
  if (value === null || value === undefined) return null;
  const displayValue =
    typeof value === "boolean" ? (value ? "Sim" : "Não") : value;
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p>{displayValue}</p>
    </div>
  );
};

export default function AccountsPayPage() {
  const { user, loading } = useAuth();
  const [accountsPay, setAccountsPay] = useState<AccountPay[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountPay | null>(null);
  const [accountToPay, setAccountToPay] = useState<AccountPay | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountPay | null>(
    null
  );
  const [accountToView, setAccountToView] = useState<AccountPay | null>(null);

  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [selectedCCId, setSelectedCCId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    const pendingAccounts = accountsPay.filter((acc) => !acc.paid);
    const totalPendingAmount = pendingAccounts.reduce(
      (sum, acc) => sum + acc.amount,
      0
    );
    return { totalPendingAmount, pendingCount: pendingAccounts.length };
  }, [accountsPay]);

  const fetchAccountsPay = async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/accounts-pay");
      setAccountsPay(
        response.data.map((account: any) => ({
          ...account,
          amount: parseFloat(account.amount),
        }))
      );
    } catch (err) {
      toast.error("Falha ao carregar contas a pagar.");
    } finally {
      setIsFetching(false);
    }
  };

  const fetchContasCorrentes = async () => {
    try {
      const response = await api.get("/contas-correntes");
      setContasCorrentes(response.data);
    } catch (error) {
      toast.error("Falha ao buscar contas correntes.");
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchAccountsPay();
      fetchContasCorrentes();
    }
  }, [user, loading]);

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchAccountsPay();
  };

  const handlePay = async () => {
    if (!accountToPay || !selectedCCId) {
      toast.error("Selecione uma conta corrente.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/accounts-pay/${accountToPay.id}/pay`, {
        paidAt: new Date(),
        contaCorrenteId: selectedCCId,
      });
      toast.success("Pagamento registrado com sucesso!");
      setAccountToPay(null);
      fetchAccountsPay();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao registrar pagamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/accounts-pay/${accountToDelete.id}`);
      toast.success("Conta a pagar excluída com sucesso!");
      setAccountsPay(accountsPay.filter((acc) => acc.id !== accountToDelete.id));
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
    { 
      accessorKey: "description", 
      header: "Descrição",
      cell: ({ row }) => {
        const account = row.original;
        if (account.isInstallment && account.totalInstallments && account.currentInstallmentNumber) {
          return `${account.description} (${account.currentInstallmentNumber}/${account.totalInstallments})`;
        }
        return account.description;
      },
    },
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
      cell: ({ row }) => {
        const isPaid = row.getValue("paid");
        const paidAt = row.original.paidAt;
        return isPaid ? (
          <span className="inline-flex items-center text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Pago em{" "}
            {formatDate(paidAt)}
          </span>
        ) : (
          <span className="inline-flex items-center text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-4 h-4 mr-1" /> Pendente
          </span>
        );
      },
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
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setAccountToView(account)}>
                <Eye className="mr-2 h-4 w-4" /> Visualizar
              </DropdownMenuItem>
              {!account.paid && (
                <>
                  <DropdownMenuItem onClick={() => setAccountToPay(account)}>
                    <DollarSign className="mr-2 h-4 w-4" /> Registrar Pagamento
                  </DropdownMenuItem>
                  <DropdownMenuItem
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) return <p className="text-center p-10">Carregando...</p>;
  if (!user)
    return <p className="text-center p-10">Faça login para continuar.</p>;

  return (
    <div className="space-y-4 my-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total a Pagar
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalPendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.pendingCount} conta(s) pendente(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Contas a Pagar</CardTitle>
            <Button onClick={handleOpenNewModal}>Nova Conta</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p className="text-center p-10">Buscando dados...</p>
          ) : (
            <DataTable
              columns={columns}
              data={accountsPay}
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
        description="Preencha os detalhes da conta a pagar."
      >
        <AccountPayForm account={accountToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!accountToView}
        onOpenChange={() => setAccountToView(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <DetailItem label="Descrição" value={accountToView?.description} />
            <DetailItem
              label="Valor"
              value={formatCurrency(accountToView?.amount)}
            />
            <DetailItem
              label="Vencimento"
              value={formatDate(accountToView?.dueDate)}
            />
            <DetailItem
              label="Status"
              value={accountToView?.paid ? "Pago" : "Pendente"}
            />
            {accountToView?.isInstallment && (
              <>
                <DetailItem label="Parcelado" value="Sim" />
                <DetailItem label="Parcela Atual" value={`${accountToView.currentInstallmentNumber}/${accountToView.totalInstallments}`} />
              </>
            )}
            {accountToView?.paid && (
              <>
                <DetailItem
                  label="Pago em"
                  value={formatDate(accountToView?.paidAt)}
                />
                <DetailItem
                  label="Debitado da Conta"
                  value={accountToView?.contaCorrente?.nome}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountToView(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!accountToPay}
        onOpenChange={(isOpen) => {
          if (!isOpen) setAccountToPay(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Conta Corrente de Origem</Label>
            <Combobox
              options={contasCorrentes.map((c) => ({
                value: c.id,
                label: c.nome,
              }))}
              value={selectedCCId}
              onValueChange={setSelectedCCId}
              placeholder="Selecione a conta..."
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handlePay} disabled={isSubmitting || !selectedCCId}>
              {isSubmitting ? "Registrando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!accountToDelete}
        onOpenChange={() => setAccountToDelete(null)}
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
    </div>
  );
}