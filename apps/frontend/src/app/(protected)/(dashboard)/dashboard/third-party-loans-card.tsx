"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

import Link from "next/link";

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

  const cardHoverClass = "cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/50 hover:shadow-md bg-card border-border/80 h-full flex flex-col justify-between overflow-hidden";

  if (loading) {
    return (
      <Card className="h-full flex flex-col justify-between border-border/80 bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 md:p-5 pb-1 sm:pb-2">
          <CardTitle className="text-[11px] sm:text-xs md:text-sm font-medium leading-tight truncate">Empréstimos a Terceiros</CardTitle>
          <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 ml-1" />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between p-3 sm:p-4 md:p-5 pt-0">
          <div className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold">Carregando...</div>
          <p className="text-[9px] sm:text-[10px] md:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Total de lançamentos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href="/contas-correntes" className="block h-full">
      <Card className={cardHoverClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 md:p-5 pb-1 sm:pb-2">
          <CardTitle className="text-[11px] sm:text-xs md:text-sm font-medium leading-tight truncate">Empréstimos a Terceiros</CardTitle>
          <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 shrink-0 ml-1" />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between p-3 sm:p-4 md:p-5 pt-0">
          <div
            className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold truncate tracking-tight text-indigo-600 dark:text-indigo-400 font-mono"
            title={formatCurrency(totalAmount)}
          >
            {formatCurrency(totalAmount)}
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Clique para ver a lista de contas
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
