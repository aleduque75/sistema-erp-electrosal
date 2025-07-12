"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CreditCardTransactionForm } from "./credit-card-transaction-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Badge } from "@/components/ui/badge";

// Interfaces
interface CreditCard {
  id: string;
  name: string;
}
interface CreditCardTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  isInstallment: boolean;
  installments: number;
  currentInstallment?: number | null;
  creditCardId: string;
  categoryId?: string;
  creditCard: CreditCard;
  creditCardBillId?: string | null;
  creditCardBill?: { paid: boolean } | null;
}

// Funções de formatação
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

  // Estados para modais e filtros
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<CreditCardTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] =
    useState<CreditCardTransaction | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<"all" | string>("all");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "unbilled" | "billed"
  >("all");

  // Busca as transações com base nos filtros
  const fetchTransactions = async () => {
    setIsFetching(true);
    try {
      const params: any = { status: selectedStatus };
      if (selectedCardId !== "all") {
        params.creditCardId = selectedCardId;
      }
      const response = await api.get("/credit-card-transactions", { params });
      setTransactions(
        response.data.map((t: any) => ({ ...t, amount: parseFloat(t.amount) }))
      );
    } catch (err) {
      toast.error("Falha ao carregar transações.");
    } finally {
      setIsFetching(false);
    }
  };

  // Busca os cartões para o filtro
  useEffect(() => {
    if (user && !loading) {
      api.get("/credit-cards").then((res) => setCards(res.data));
    }
  }, [user, loading]);

  // Busca as transações quando os filtros mudam
  useEffect(() => {
    if (user && !loading) {
      fetchTransactions();
    }
  }, [user, loading, selectedStatus, selectedCardId]);

  // Funções de ações
  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchTransactions();
  };
  const handleOpenNewModal = () => {
    setTransactionToEdit(null);
    setIsFormModalOpen(true);
  };
  const handleOpenEditModal = (transaction: CreditCardTransaction) => {
    setTransactionToEdit(transaction);
    setIsFormModalOpen(true);
  };
  const handleDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await api.delete(`/credit-card-transactions/${transactionToDelete.id}`);
      toast.success("Transação excluída com sucesso!");
      setTransactions(
        transactions.filter((t) => t.id !== transactionToDelete.id)
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir.");
    } finally {
      setTransactionToDelete(null);
    }
  };

  const columns: ColumnDef<CreditCardTransaction>[] = [
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => (
        <span
          className={
            row.original.creditCardBill?.paid
              ? "line-through text-muted-foreground"
              : ""
          }
        >
          {row.original.description}
        </span>
      ),
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
    { accessorKey: "creditCard.name", header: "Cartão" },
    {
      accessorKey: "installments",
      header: "Parcela",
      cell: ({ row }) => {
        const t = row.original;
        return t.isInstallment
          ? `${t.currentInstallment}/${t.installments}`
          : "À Vista";
      },
    },
    {
      header: "Status",
      cell: ({ row }) => {
        const bill = row.original.creditCardBill;
        if (bill) {
          return bill.paid ? (
            <Badge variant="default">Quitada</Badge>
          ) : (
            <Badge variant="secondary">Na Fatura</Badge>
          );
        }
        return <Badge variant="outline">Aberta</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
        const isBilled = !!transaction.creditCardBillId;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem
                disabled={isBilled}
                onClick={() => handleOpenEditModal(transaction)}
              >
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isBilled}
                onClick={() => setTransactionToDelete(transaction)}
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
  if (!user)
    return <p className="text-center p-10">Faça login para continuar.</p>;

  return (
    <div className="space-y-4 my-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <CardTitle>Transações de Cartão de Crédito</CardTitle>
            <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-2">
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por cartão..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Cartões</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedStatus}
                onValueChange={(value: "all" | "unbilled" | "billed") =>
                  setSelectedStatus(value)
                }
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unbilled">Não Faturadas</SelectItem>
                  <SelectItem value="billed">Faturadas</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleOpenNewModal} className="w-full md:w-auto">
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
        title={transactionToEdit ? "Editar Transação" : "Nova Transação"}
        description="Preencha os detalhes da transação."
      >
        <CreditCardTransactionForm
          transaction={transactionToEdit}
          onSave={handleSave}
        />
      </ResponsiveDialog>

      <Dialog
        open={!!transactionToDelete}
        onOpenChange={(open) => {
          if (!open) setTransactionToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a transação "
              {transactionToDelete?.description}"?
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
