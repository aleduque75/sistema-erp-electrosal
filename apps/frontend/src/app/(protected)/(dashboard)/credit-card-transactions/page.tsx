"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CreditCardTransactionForm } from "./credit-card-transaction-form";

// Interfaces
interface CreditCardTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  isInstallment: boolean;
  currentInstallment?: number;
  installments?: number;
  contaContabil?: { nome: string };
  creditCardId: string; // Adicionado para edição
}

// Funções de Formatação
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

// Componente da Página
export default function CreditCardTransactionsPage() {
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [loading, setIsPageLoading] = useState(true);

  // Estados para a modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<CreditCardTransaction | null>(null);

  const fetchTransactions = async () => {
    setIsPageLoading(true);
    try {
      const response = await api.get("/credit-card-transactions");
      setTransactions(response.data);
    } catch (err) {
      toast.error("Falha ao buscar transações do cartão.");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSave = () => {
    setIsFormModalOpen(false);
    setTransactionToEdit(null);
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

  const columns: ColumnDef<CreditCardTransaction>[] = [
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const { description, isInstallment, currentInstallment, installments } =
          row.original;
        return (
          <div>
            {description}
            {isInstallment && (
              <span className="text-xs text-muted-foreground ml-2">
                ({currentInstallment}/{installments})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "contaContabil.nome",
      header: "Categoria",
      cell: ({ row }) =>
        row.original.contaContabil?.nome || (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Valor</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-red-600">
          {formatCurrency(row.original.amount)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
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
                  onClick={() => handleOpenEditModal(transaction)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lançamentos no Cartão</h1>
        <Button onClick={handleOpenNewModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={transactions}
            isLoading={loading}
            filterColumnId="description"
            filterPlaceholder="Pesquisar por descrição..."
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={transactionToEdit ? "Editar Lançamento" : "Novo Lançamento"}
        description="Preencha os detalhes da transação."
      >
        <CreditCardTransactionForm
          transaction={transactionToEdit}
          onSave={handleSave}
        />
      </ResponsiveDialog>
    </div>
  );
}
