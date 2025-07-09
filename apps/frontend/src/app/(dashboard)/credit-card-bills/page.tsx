"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  DollarSign,
  CheckCircle2,
  FilePlus2,
  ReceiptText,
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

// Interfaces
interface CreditCardBill {
  id: string;
  name: string;
  totalAmount: number;
  dueDate: string;
  paid: boolean;
  creditCard: { name: string };
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

  const [billToPay, setBillToPay] = useState<CreditCardBill | null>(null);
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
        contasRes.data.filter((c) => c.tipo === "DESPESA" && c.aceitaLancamento)
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

  const handlePayBill = async () => {
    if (!billToPay || !selectedCCId || !selectedContabilId) {
      toast.error("Selecione a conta de origem e a conta de despesa.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/credit-card-bills/${billToPay.id}/pay`, {
        contaCorrenteId: selectedCCId,
        contaContabilId: selectedContabilId,
      });
      toast.success(`Fatura "${billToPay.name}" paga com sucesso!`);
      setBillToPay(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao pagar a fatura.");
    } finally {
      setIsSubmitting(false);
    }
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
    { accessorKey: "_count.transactions", header: "Nº de Itens" },
    {
      accessorKey: "paid",
      header: "Status",
      cell: ({ row }) =>
        row.getValue("paid") ? (
          <Badge variant="success">Paga</Badge>
        ) : (
          <Badge variant="warning">Aberta</Badge>
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
              {!bill.paid && (
                <DropdownMenuItem onClick={() => setBillToPay(bill)}>
                  <DollarSign className="mr-2 h-4 w-4" /> Pagar Fatura
                </DropdownMenuItem>
              )}
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
                <FilePlus2 className="mr-2 h-4 w-4" /> Gerar Fatura Manual
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

      <Dialog open={!!billToPay} onOpenChange={() => setBillToPay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Fatura: {billToPay?.name}</DialogTitle>
            <DialogDescription>
              Confirme os dados para o pagamento da fatura no valor de{" "}
              <strong>{formatCurrency(billToPay?.totalAmount)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Pagar com a Conta (Origem do Dinheiro)</Label>
              <Combobox
                options={contasCorrentes.map((c) => ({
                  value: c.id,
                  label: `${c.nome} (${c.numeroConta})`,
                }))}
                value={selectedCCId}
                onValueChange={setSelectedCCId}
                placeholder="Selecione a conta corrente..."
              />
            </div>
            <div className="space-y-2">
              <Label>Conta de Despesa (Contabilidade)</Label>
              <Combobox
                options={contasDespesa.map((c) => ({
                  value: c.id,
                  label: `${c.codigo} - ${c.nome}`,
                }))}
                value={selectedContabilId}
                onValueChange={setSelectedContabilId}
                placeholder="Selecione a conta de despesa..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handlePayBill}
              disabled={isSubmitting || !selectedCCId || !selectedContabilId}
            >
              {isSubmitting ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
