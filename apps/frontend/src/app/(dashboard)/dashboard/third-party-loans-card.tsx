"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export function ThirdPartyLoansCard() {
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTotal = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ totalAmount: number }>("/dashboard/third-party-loans-summary");
        setTotalAmount(response.data.totalAmount);
      } catch (error) {
        console.error("Erro ao buscar total de empréstimos a terceiros:", error);
        toast.error("Falha ao carregar total de empréstimos a terceiros.");
      } finally {
        setLoading(false);
      }
    };

    fetchTotal();
  }, []);

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      value || 0
    );

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Empréstimos a Terceiros</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Carregando...</div>
          <p className="text-xs text-muted-foreground">
            Total de lançamentos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Empréstimos a Terceiros</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
        <p className="text-xs text-muted-foreground">
          Total de lançamentos
        </p>
      </CardContent>
    </Card>
  );
}
