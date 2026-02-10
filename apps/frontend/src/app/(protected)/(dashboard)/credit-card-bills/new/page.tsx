"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { format, endOfDay, addMonths } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table"; // Importa a DataTable
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  isInstallment: boolean;
  currentInstallment?: number;
}
interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDate: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export default function NewCreditCardBillPage() {
  const router = useRouter();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [billName, setBillName] = useState("");
  const [loading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [closingDate, setClosingDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    api.get("/credit-cards").then((res) => {
      setCreditCards(res.data);
      setIsPageLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCard) {
      setIsPageLoading(true);
      api
        .get(`/credit-card-transactions?creditCardId=${selectedCard.id}`)
        .then((res) => {
          console.log("Transações recebidas da API:", res.data); // <-- PONTO DE DEBUG
          setAllTransactions(res.data);
          setBillName(`Fatura ${format(new Date(), "MMMM/yyyy")}`);
          setSelection({});
        })
        .catch(() => toast.error("Falha ao buscar transações."))
        .finally(() => setIsPageLoading(false));
    }
  }, [selectedCard]);

  const filteredTransactions = useMemo(() => {
    if (!closingDate) return allTransactions;
    const endDate = endOfDay(new Date(closingDate));
    return allTransactions.filter((tx) => new Date(tx.date) <= endDate);
  }, [allTransactions, closingDate]);

  const handleSelectAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {};
    filteredTransactions.forEach((tx) => {
      newSelection[tx.id] = checked;
    });
    setSelection(newSelection);
  };

  const selectedTransactionsIds = useMemo(
    () => Object.keys(selection).filter((id) => selection[id]),
    [selection]
  );
  const totalAmount = useMemo(() => {
    return filteredTransactions
      .filter((tx) => selectedTransactionsIds.includes(tx.id))
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [filteredTransactions, selectedTransactionsIds]);

  const handleSaveBill = async () => {
    /* ... (sua função handleSaveBill) ... */
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => handleSelectAll(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selection[row.original.id] || false}
          onCheckedChange={(value) =>
            setSelection((prev) => ({ ...prev, [row.original.id]: !!value }))
          }
        />
      ),
    },
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => formatDate(row.original.date),
    },
    { accessorKey: "description", header: "Descrição" },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar Nova Fatura de Cartão</CardTitle>
        <CardDescription>
          Selecione um cartão e os lançamentos para incluir na fatura.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label>Cartão de Crédito</Label>
            <Select
              onValueChange={(id) =>
                setSelectedCard(creditCards.find((c) => c.id === id) || null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cartão..." />
              </SelectTrigger>
              <SelectContent>
                {creditCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <Label>Nome da Fatura</Label>
            <Input
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              placeholder="Ex: Fatura Agosto/2025"
            />
          </div>
        </div>

        {selectedCard && (
          <div>
            <div className="flex justify-end mb-4">
              <div className="space-y-2">
                <Label htmlFor="closing-date">
                  Mostrar lançamentos até a data:
                </Label>
                <Input
                  id="closing-date"
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                />
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredTransactions}
              isLoading={loading}
              filterColumnId="description"
            />

            <div className="text-right mt-4 space-y-2">
              <p className="text-lg font-semibold">
                Total Selecionado: {formatCurrency(totalAmount)}
              </p>
              <Button onClick={handleSaveBill} disabled={isSaving}>
                {isSaving
                  ? "Gerando..."
                  : `Gerar Fatura com ${selectedTransactionsIds.length} Lançamentos`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
