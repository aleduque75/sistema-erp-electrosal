"use client";

import { useEffect, useState } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CreditCardBillForm } from "./credit-card-bill-form";

// Interfaces
interface CreditCardBill {
  id: string;
  name: string;
  totalAmount: number;
  dueDate: Date;
  paid: boolean;
  paidAt?: string | null;
  creditCard: { name: string };
  transactions: {
    id: string;
    date: string;
    description: string;
    amount: number;
  }[];
  _count: { transactions: number };
}
interface ContaCorrente {
  id: string;
  nome: string;
  numeroConta: string;
}
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
  tipo: string;
  aceitaLancamento: boolean;
}

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

  const [billToView, setBillToView] = useState<CreditCardBill | null>(null);
  const [billToPay, setBillToPay] = useState<CreditCardBill | null>(null);
  const [billToEdit, setBillToEdit] = useState<CreditCardBill | null>(null);
  const [billToDelete, setBillToDelete] = useState<CreditCardBill | null>(null);

  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [contasDespesa, setContasDespesa] = useState<ContaContabil[]>([]);
  const [selectedCCId, setSelectedCCId] = useState<string | null>(null);
  const [selectedContabilId, setSelectedContabilId] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [billsRes, ccRes, contasRes] = await Promise.all([
        api.get("/credit-card-bills"),
        api.get("/contas-correntes"),
        api.get("/contas-contabeis"),
      ]);
      setBills(
        billsRes.data.map((b: any) => ({
          ...b,
          totalAmount: parseFloat(b.totalAmount),
        }))
      );
      setContasCorrentes(ccRes.data);
      setContasDespesa(
        contasRes.data.filter(
          (c: ContaContabil) => c.tipo === "DESPESA" && c.aceitaLancamento
        )
      );
    } catch (err) {
      toast.error("Falha ao carregar dados da página.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !loading) fetchData();
  }, [user, loading]);

  const handleSave = () => {
    setBillToEdit(null);
    fetchData();
  };
  const handlePayBill = async () => {
    /* ... sua função de pagamento ... */
  };
  const handleDelete = async () => {
    /* ... sua função de exclusão ... */
  };
  const handleOpenEditModal = (bill: CreditCardBill) => {
    setBillToEdit({
      ...bill,
      dueDate: new Date(bill.dueDate), // Converte a string para Date
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
              <DropdownMenuItem onClick={() => setBillToView(bill)}>
                <Eye className="mr-2 h-4 w-4" /> Visualizar
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
        onOpenChange={(open) => {
          if (!open) setBillToEdit(null);
        }}
        title="Editar Fatura"
        description="Edite os dados da fatura selecionada."
      >
        <CreditCardBillForm bill={billToEdit} onSave={handleSave} />
      </ResponsiveDialog>
      <Dialog open={!!billToPay} onOpenChange={(open) => {
        if (!open) setBillToPay(null);
      }}>
        {/*... Modal de Pagamento ...*/}
      </Dialog>
      <Dialog open={!!billToDelete} onOpenChange={(open) => {
        if (!open) setBillToDelete(null);
      }}>
        {/*... Modal de Exclusão ...*/}
      </Dialog>
      <Dialog open={!!billToView} onOpenChange={(open) => {
        if (!open) setBillToView(null);
      }}>
        {/*... Modal de Visualização ...*/}
      </Dialog>
    </>
  );
}
