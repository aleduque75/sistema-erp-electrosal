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
import { CreditCardBillForm } from "./credit-card-bill-form";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface CreditCardTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  installments?: number | null;
}

interface CreditCardBill {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  closingDate: string;
  paymentDate: string;
  paid: boolean;
  paidAt?: string | null;
  installments?: number | null;
  currentInstallment?: number | null;
  creditCardTransactions?: CreditCardTransaction[]; // Adiciona a lista de transações
}

interface ContaCorrente {
  id: string;
  nome: string;
}

interface ContaContabil {
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

export default function CreditCardBillsPage() {
  const { user, loading } = useAuth();
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<CreditCardBill | null>(null);
  const [billToPay, setBillToPay] = useState<CreditCardBill | null>(null);
  const [billToDelete, setBillToDelete] = useState<CreditCardBill | null>(null);
  const [billToView, setBillToView] = useState<CreditCardBill | null>(null);

  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [selectedCCId, setSelectedCCId] = useState<string | null>(null);
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [selectedContaContabilId, setSelectedContaContabilId] = useState<string | null>(null);
  const [paidAtDate, setPaidAtDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    const pendingBills = bills.filter((bill) => !bill.paid);
    const totalPendingAmount = pendingBills.reduce(
      (sum, bill) => sum + bill.amount,
      0
    );
    return { totalPendingAmount, pendingCount: pendingBills.length };
  }, [bills]);

  const fetchBills = async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/credit-card-bills");
      setBills(
        response.data.map((bill: any) => ({
          ...bill,
          amount: parseFloat(bill.amount),
        }))
      );
    } catch (err) {
      toast.error("Falha ao carregar faturas de cartão de crédito.");
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

  const fetchContasContabeis = async () => {
    try {
      const response = await api.get("/contas-contabeis");
      setContasContabeis(response.data);
    } catch (error) {
      toast.error("Falha ao buscar contas contábeis.");
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchBills();
      fetchContasCorrentes();
      fetchContasContabeis();
    }
  }, [user, loading]);

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchBills();
  };

  const handlePay = async () => {
    if (!billToPay || !selectedCCId || !selectedContaContabilId || !paidAtDate) {
      toast.error("Por favor, preencha todos os campos de pagamento.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/credit-card-bills/${billToPay.id}/pay`, {
        paidAt: paidAtDate.toISOString(),
        contaCorrenteId: selectedCCId,
        contaContabilId: selectedContaContabilId,
      });
      toast.success("Pagamento de fatura registrado com sucesso!");
      setBillToPay(null);
      setSelectedCCId(null);
      setSelectedContaContabilId(null);
      setPaidAtDate(new Date());
      fetchBills();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao registrar pagamento da fatura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!billToDelete) return;
    try {
      await api.delete(`/credit-card-bills/${billToDelete.id}`);
      toast.success("Fatura excluída com sucesso!");
      setBills(bills.filter((bill) => bill.id !== billToDelete.id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir fatura.");
    } finally {
      setBillToDelete(null);
    }
  };

  const handleOpenNewModal = () => {
    setBillToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (bill: CreditCardBill) => {
    setBillToEdit(bill);
    setIsFormModalOpen(true);
  };

  const columns: ColumnDef<CreditCardBill>[] = [
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
      cell: ({ row }) => {
        const isPaid = row.getValue("paid");
        const paidAt = row.original.paidAt;
        return isPaid ? (
          <span className="inline-flex items-center text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Paga em{" "}
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
        const bill = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setBillToView(bill)}>
                <Eye className="mr-2 h-4 w-4" /> Visualizar
              </DropdownMenuItem>
              {!bill.paid && (
                <>
                  <DropdownMenuItem onClick={() => setBillToPay(bill)}>
                    <DollarSign className="mr-2 h-4 w-4" /> Registrar Pagamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenEditModal(bill)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setBillToDelete(bill)}
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
              Total de Faturas Pendentes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalPendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.pendingCount} fatura(s) pendente(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Faturas de Cartão de Crédito</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p className="text-center p-10">Buscando faturas...</p>
          ) : (
            <DataTable
              columns={columns}
              data={bills}
              filterColumnId="description"
              filterPlaceholder="Pesquisar por descrição..."
            />
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={billToEdit ? "Editar Fatura" : "Nova Fatura"}
        description="Preencha os detalhes da fatura do cartão de crédito."
      >
        <CreditCardBillForm bill={billToEdit} onSave={handleSave} />
      </ResponsiveDialog>

      <Dialog
        open={!!billToView}
        onOpenChange={() => setBillToView(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Fatura</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <DetailItem label="Descrição" value={billToView?.description} />
            <DetailItem
              label="Valor"
              value={formatCurrency(billToView?.amount)}
            />
            <DetailItem
              label="Vencimento"
              value={formatDate(billToView?.dueDate)}
            />
            <DetailItem
              label="Fechamento"
              value={formatDate(billToView?.closingDate)}
            />
            <DetailItem
              label="Pagamento Limite"
              value={formatDate(billToView?.paymentDate)}
            />
            {billToView?.installments && (
              <DetailItem
                label="Parcelas"
                value={`${billToView.installments}`}
              />
            )}
            <DetailItem
              label="Status"
              value={billToView?.paid ? "Paga" : "Pendente"}
            />
            {billToView?.paid && (
              <DetailItem
                label="Paga em"
                value={formatDate(billToView?.paidAt)}
              />
            )}

            {billToView?.creditCardTransactions && billToView.creditCardTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Transações da Fatura:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billToView.creditCardTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{formatDate(t.date)}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>
                          {t.installments ? `${t.installments}` : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillToView(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!billToPay}
        onOpenChange={(isOpen) => {
          if (!isOpen) setBillToPay(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento da Fatura</DialogTitle>
            <DialogDescription>
              Selecione a conta de onde o valor de{" "}
              {formatCurrency(billToPay?.amount)} será debitado.
            </DialogDescription>
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
            <Label>Conta Contábil (Despesa)</Label>
            <Combobox
              options={contasContabeis.map((c) => ({
                value: c.id,
                label: c.nome,
              }))}
              value={selectedContaContabilId}
              onValueChange={setSelectedContaContabilId}
              placeholder="Selecione a conta contábil..."
            />
            <Label>Data do Pagamento</Label>
            <DatePicker date={paidAtDate} setDate={setPaidAtDate} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handlePay} disabled={isSubmitting || !selectedCCId || !selectedContaContabilId || !paidAtDate}>
              {isSubmitting ? "Registrando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!billToDelete}
        onOpenChange={() => setBillToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a fatura "{billToDelete?.description}"?
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
