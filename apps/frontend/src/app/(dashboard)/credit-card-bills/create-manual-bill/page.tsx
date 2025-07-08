"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";

interface CreditCardTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  isInstallment: boolean;
  totalInstallments?: number | null;
  currentInstallmentNumber?: number | null;
  creditCardBillId?: string | null; // Para filtrar transações não faturadas
}

interface CreateCreditCardBillWithTransactionsDto {
  description: string;
  dueDate: string;
  closingDate: string;
  paymentDate: string;
  transactionIds: string[];
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : "N/A";

export default function CreateManualCreditCardBillPage() {
  const { user, loading } = useAuth();
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [billDescription, setBillDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [closingDate, setClosingDate] = useState<Date | undefined>(undefined);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);
  const [selectedTransactionsTotal, setSelectedTransactionsTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const fetchUnbilledTransactions = async () => {
    setIsFetching(true);
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (filterStartDate) {
        params.startDate = format(filterStartDate, "yyyy-MM-dd");
      }
      if (filterEndDate) {
        params.endDate = format(filterEndDate, "yyyy-MM-dd");
      }

      const response = await api.get("/credit-card-transactions", { params });
      // Filtra apenas as transações que não estão associadas a uma fatura
      setTransactions(
        response.data
          .filter((t: CreditCardTransaction) => !t.creditCardBillId)
          .map((transaction: any) => ({
            ...transaction,
            amount: parseFloat(transaction.amount),
          }))
      );
      // Resetar seleção e total ao recarregar transações
      setSelectedTransactionIds([]);
      setSelectedTransactionsTotal(0);
    } catch (err) {
      toast.error("Falha ao carregar transações não faturadas.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchUnbilledTransactions();
    }
  }, [user, loading, filterStartDate, filterEndDate]);

  const handleCheckboxChange = (transactionId: string, isChecked: boolean) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    setSelectedTransactionIds((prev) => {
      const newSelection = isChecked
        ? [...prev, transactionId]
        : prev.filter((id) => id !== transactionId);

      // Recalcular o total
      const newTotal = transactions.reduce((sum, t) => {
        return newSelection.includes(t.id) ? sum + t.amount : sum;
      }, 0);
      setSelectedTransactionsTotal(newTotal);

      return newSelection;
    });
  };

  const handleSubmit = async () => {
    if (!billDescription || !dueDate || !closingDate || !paymentDate || selectedTransactionIds.length === 0) {
      toast.error("Por favor, preencha todos os campos e selecione pelo menos uma transação.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newBill: CreateCreditCardBillWithTransactionsDto = {
        description: billDescription,
        dueDate: format(dueDate, "yyyy-MM-dd"),
        closingDate: format(closingDate, "yyyy-MM-dd"),
        paymentDate: format(paymentDate, "yyyy-MM-dd"),
        transactionIds: selectedTransactionIds,
      };

      await api.post("/credit-card-bills/with-transactions", newBill);
      toast.success("Fatura criada com sucesso!");
      router.push("/credit-card-bills"); // Redireciona para a lista de faturas
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao criar fatura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<CreditCardTransaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            const allVisibleTransactionIds = table.getRowModel().rows.map((row) => row.original.id);
            const newSelection = value
              ? Array.from(new Set([...selectedTransactionIds, ...allVisibleTransactionIds]))
              : selectedTransactionIds.filter((id) => !allVisibleTransactionIds.includes(id));

            setSelectedTransactionIds(newSelection);

            const newTotal = transactions.reduce((sum, t) => {
              return newSelection.includes(t.id) ? sum + t.amount : sum;
            }, 0);
            setSelectedTransactionsTotal(newTotal);

            table.toggleAllPageRowsSelected(!!value);
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedTransactionIds.includes(row.original.id)}
          onCheckedChange={(value) =>
            handleCheckboxChange(row.original.id, !!value)
          }
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    { accessorKey: "description", header: "Descrição" },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => formatCurrency(row.getValue("amount")),
    },
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
    {
      accessorKey: "isInstallment",
      header: "Parcelas",
      cell: ({ row }) => {
        const isInstallment = row.getValue("isInstallment");
        const totalInstallments = row.original.totalInstallments;
        const currentInstallmentNumber = row.original.currentInstallmentNumber;

        if (isInstallment && totalInstallments && currentInstallmentNumber) {
          return `${currentInstallmentNumber}/${totalInstallments}`;
        }
        return "À Vista";
      },
    },
  ];

  if (loading) return <p className="text-center p-10">Carregando...</p>;
  if (!user)
    return <p className="text-center p-10">Faça login para continuar.</p>;

  return (
    <div className="space-y-4 my-8">
      <Card>
        <CardHeader>
          <CardTitle>Criar Fatura de Cartão de Crédito Manualmente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição da Fatura
              </Label>
              <Input
                id="description"
                value={billDescription}
                onChange={(e) => setBillDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Data de Vencimento
              </Label>
              <div className="col-span-3">
                <DatePicker date={dueDate} setDate={setDueDate} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="closingDate" className="text-right">
                Data de Fechamento
              </Label>
              <div className="col-span-3">
                <DatePicker date={closingDate} setDate={setClosingDate} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentDate" className="text-right">
                Data Limite para Pagamento
              </Label>
              <div className="col-span-3">
                <DatePicker date={paymentDate} setDate={setPaymentDate} />
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-4">Transações Disponíveis</h3>

          <div className="flex justify-between items-center mb-4">
            <p className="text-md font-medium">Total Selecionado: {formatCurrency(selectedTransactionsTotal)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-1">
              <Label htmlFor="filterStartDate">Data Inicial</Label>
              <DatePicker date={filterStartDate} setDate={setFilterStartDate} placeholder="Selecione a data inicial" />
            </div>
            <div className="col-span-1">
              <Label htmlFor="filterEndDate">Data Final</Label>
              <DatePicker date={filterEndDate} setDate={setFilterEndDate} placeholder="Selecione a data final" />
            </div>
            <div className="col-span-1 flex items-end">
              <Button onClick={fetchUnbilledTransactions}>Aplicar Filtro</Button>
            </div>
          </div>

          {isFetching ? (
            <p className="text-center p-10">Buscando transações...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center p-10">Nenhuma transação não faturada encontrada.</p>
          ) : (
            <DataTable
              columns={columns}
              data={transactions}
              filterColumnId="description"
              filterPlaceholder="Pesquisar por descrição..."
              pageSize={9999} // Exibe todos os lançamentos no período
            />
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleSubmit} disabled={isSubmitting || selectedTransactionIds.length === 0}>
              {isSubmitting ? "Criando Fatura..." : "Criar Fatura"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
