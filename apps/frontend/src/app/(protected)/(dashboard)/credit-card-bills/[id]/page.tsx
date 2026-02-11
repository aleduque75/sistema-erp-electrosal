"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Interfaces (podem ser movidas para um arquivo central depois)
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}
interface CreditCardBill {
  id: string;
  name: string;
  totalAmount: number;
  dueDate: string;
  paid: boolean;
  transactions: Transaction[];
  creditCard: { name: string };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export default function BillDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params?.id as string;

  const [bill, setBill] = useState<CreditCardBill | null>(null);
  const [loading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (billId) {
      api
        .get(`/credit-card-bills/${billId}`)
        .then((response) => setBill(response.data))
        .catch(() => toast.error("Falha ao carregar detalhes da fatura."))
        .finally(() => setIsPageLoading(false));
    }
  }, [billId]);

  if (isLoading)
    return <p className="text-center p-10">Carregando detalhes...</p>;
  if (!bill) return <p className="text-center p-10">Fatura não encontrada.</p>;

  return (
    <div className="mx-auto my-8 space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button variant="ghost" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <CardTitle className="text-2xl">{bill.name}</CardTitle>
          <CardDescription>
            Cartão: {bill.creditCard.name} | Vencimento:{" "}
            {formatDate(bill.dueDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{formatDate(t.date)}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between items-center font-bold text-lg">
          <span>
            Status:{" "}
            {bill.paid ? (
              <Badge variant="default">Paga</Badge>
            ) : (
              <Badge variant="secondary">Aberta</Badge>
            )}
          </span>
          <span>Total: {formatCurrency(bill.totalAmount)}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
