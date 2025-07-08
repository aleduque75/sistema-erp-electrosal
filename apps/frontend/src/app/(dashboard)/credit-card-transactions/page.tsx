"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CreditCardTransactionForm } from "@/components/forms/CreditCardTransactionForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

interface CreditCardTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  isInstallment: boolean;
  totalInstallments?: number | null;
  currentInstallmentNumber?: number | null;
  creditCardBillId?: string | null;
  creditCardBill?: { // Inclui informações da fatura associada
    id: string;
    paid: boolean;
  } | null;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : "N/A";

export default function CreditCardTransactionsPage() {
  const { user, loading } = useAuth();
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'paid'>('all');
  const router = useRouter();

  const fetchTransactions = async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/credit-card-transactions", {
        params: { status: selectedStatus },
      });
      setTransactions(
        response.data.map((transaction: any) => ({
          ...transaction,
          amount: parseFloat(transaction.amount),
        }))
      );
    } catch (err) {
      toast.error("Falha ao carregar transações de cartão de crédito.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchTransactions();
    }
  }, [user, loading, selectedStatus]);

  const columns: ColumnDef<CreditCardTransaction>[] = [
    { accessorKey: "description", header: "Descrição",
      cell: ({ row }) => {
        const isPaid = row.original.creditCardBill?.paid;
        const description = row.original.description;
        return (
          <span className={isPaid ? "line-through" : ""}>
            {description}
          </span>
        );
      },
    },
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
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const bill = row.original.creditCardBill;
        if (bill) {
          return bill.paid ? (
            <span className="inline-flex items-center text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-200">
              Quitada
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-medium bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full dark:bg-orange-900 dark:text-orange-200">
              Aberta
            </span>
          );
        }
        return (
          <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full dark:bg-gray-900 dark:text-gray-200">
            Não Faturada
          </span>
        );
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <CardTitle>Transações de Cartão de Crédito</CardTitle>
            <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-2">
              <Select
                value={selectedStatus}
                onValueChange={(value: 'all' | 'open' | 'paid') => setSelectedStatus(value)}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="paid">Quitadas</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsFormModalOpen(true)} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Transação
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p className="text-center p-10">Buscando transações...</p>
          ) : (
            <DataTable
              columns={columns}
              data={transactions}
              filterColumnId="description"
              filterPlaceholder="Pesquisar por descrição..."
            />
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title="Nova Transação de Cartão de Crédito"
      >
        <CreditCardTransactionForm
          onSave={() => {
            setIsFormModalOpen(false);
            fetchTransactions();
          }}
        />
      </ResponsiveDialog>
    </div>
  );
}
