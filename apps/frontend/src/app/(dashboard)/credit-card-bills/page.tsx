"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  DollarSign,
  FilePlus2,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CreditCardBillForm } from "./credit-card-bill-form";
import { PayBillForm } from "./pay-bill-form";
import { formatInTimeZone } from 'date-fns-tz';

// Interfaces
interface CreditCardBill {
  id: string;
  name: string;
  totalAmount: number;
  dueDate: Date;
  paid: boolean;
  creditCard: { name: string };
  _count: { transactions: number };
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

export default function CreditCardBillsPage() {
  const { user, loading } = useAuth();
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Estados dos modais
  const [billToPay, setBillToPay] = useState<CreditCardBill | null>(null);
  const [billToEdit, setBillToEdit] = useState<CreditCardBill | null>(null);
  const [billToDelete, setBillToDelete] = useState<CreditCardBill | null>(null);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const params: { creditCardId?: string; startDate?: string; endDate?: string } = {};
      if (selectedCreditCardId) {
        params.creditCardId = selectedCreditCardId;
      }
      if (startDate) {
        params.startDate = startDate.toISOString();
      }
      if (endDate) {
        params.endDate = endDate.toISOString();
      }

      const response = await api.get("/credit-card-bills", { params });
      setBills(
        response.data.map((b: any) => ({
          ...b,
          totalAmount: parseFloat(b.totalAmount),
        }))
      );
    } catch (err) {
      toast.error("Falha ao carregar faturas.");
    } finally {
      setIsFetching(false);
    }
  }, [selectedCreditCardId, startDate, endDate]);

  useEffect(() => {
    if (user && !loading) {
      fetchData();
      api.get("/credit-cards").then((res) => setCreditCards(res.data));
    }
  }, [user, loading, fetchData]);

  // Handler para fechar modais e atualizar dados
  const handleCloseAndRefresh = () => {
    setBillToEdit(null);
    setBillToPay(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!billToDelete) return;
    try {
      await api.delete(`/credit-card-bills/${billToDelete.id}`);
      toast.success("Fatura excluída com sucesso!");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir fatura.");
    } finally {
      setBillToDelete(null);
    }
  };

  const handleOpenEditModal = (bill: CreditCardBill) => {
    setBillToEdit({
      ...bill,
      dueDate: new Date(bill.dueDate),
    });
  };

  const columns: ColumnDef<CreditCardBill>[] = [
    { accessorKey: "name", header: "Descrição da Fatura" },
    { accessorKey: "creditCard.name", header: "Cartão" },
    {
      accessorKey: "totalAmount",
      header: "Valor Total",
      cell: ({ row }) => formatCurrency(row.getValue("totalAmount")),
    },
    {
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }) => formatDate(row.getValue("dueDate")),
    },
    {
      header: "Nº de Itens",
      cell: ({ row }) => row.original._count.transactions,
    },
    {
      accessorKey: "paid",
      header: "Status",
      cell: ({ row }) =>
        row.getValue("paid") ? (
          <Badge variant="default">Paga</Badge>
        ) : (
          <Badge variant="secondary">Aberta</Badge>
        ),
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
              {/* <<< CORREÇÃO 2: "Visualizar" agora é um Link >>> */}
              <DropdownMenuItem asChild>
                <Link href={`/credit-card-bills/${bill.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!bill.paid && (
                <DropdownMenuItem onClick={() => setBillToPay(bill)}>
                  <DollarSign className="mr-2 h-4 w-4" /> Pagar Fatura
                </DropdownMenuItem>
              )}
              {!bill.paid && (
                <DropdownMenuItem onClick={() => handleOpenEditModal(bill)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setBillToDelete(bill)}
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
            <CardTitle>Faturas de Cartão de Crédito</CardTitle>
            <Link href="/credit-card-bills/new">
              <Button>
                <FilePlus2 className="mr-2 h-4 w-4" /> Gerar Fatura
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={bills}
            filterColumnId="name"
            filterPlaceholder="Pesquisar por fatura..."
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={!!billToEdit}
        onOpenChange={(open) => !open && setBillToEdit(null)}
        title="Editar Fatura"
        description="Edite os dados da fatura selecionada."
      >
        <CreditCardBillForm
          bill={
            billToEdit
              ? {
                  id: billToEdit.id,
                  name: billToEdit.name,
                  dueDate: billToEdit.dueDate,
                  endDate: billToEdit.dueDate, // Ajuste conforme necessário
                }
              : null
          }
          onSave={handleCloseAndRefresh}
        />
      </ResponsiveDialog>

      <Dialog
        open={!!billToDelete}
        onOpenChange={(open) => !open && setBillToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a fatura "{billToDelete?.name}"?
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
        open={!!billToPay}
        onOpenChange={(open) => !open && setBillToPay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Fatura</DialogTitle>
            <DialogDescription>
              Confirmar pagamento para "{billToPay?.name}".
            </DialogDescription>
          </DialogHeader>
          {/* <<< CORREÇÃO 1: onSave agora chama a função correta >>> */}
          {billToPay && (
            <PayBillForm billId={billToPay.id} onSave={handleCloseAndRefresh} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
