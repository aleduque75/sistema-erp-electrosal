"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Coins, DollarSign, Scale } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const formatNumber = (value: number, decimals = 4) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);

interface MarketData {
  date: string;
  usdPrice: number;
  goldPricePerGramBRL: number;
  silverPricePerGramBRL: number;
  updatedAt: string;
}

export function MarketDataCards() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      api.get("/market-data/latest")
        .then((res) => setData(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchData();
    // Refresh every minute to show updated data from cron
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return null;

  const lastUpdate = format(new Date(data.updatedAt), "HH:mm", { locale: ptBR });

  const cardBaseClass = "transition-all duration-200 hover:scale-[1.02] hover:shadow-md h-full flex flex-col justify-between border-border/80 overflow-hidden";

  return (
    <>
      <Card className={`${cardBaseClass} bg-blue-50/40 dark:bg-blue-950/20`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Dólar (Comercial)</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500 shrink-0" />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-0">
          <div
            className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-tight truncate"
            title={formatNumber(data.usdPrice, 4)}
          >
            {formatNumber(data.usdPrice, 4)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Atualizado às {lastUpdate}</p>
        </CardContent>
      </Card>

      <Card className={`${cardBaseClass} bg-amber-50/40 dark:bg-amber-950/20`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Ouro (Grama)</CardTitle>
          <Scale className="h-4 w-4 text-amber-500 shrink-0" />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-0">
          <div
            className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tracking-tight truncate"
            title={formatCurrency(data.goldPricePerGramBRL)}
          >
            {formatCurrency(data.goldPricePerGramBRL)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Sincronizado às {lastUpdate}</p>
        </CardContent>
      </Card>

      <Card className={`${cardBaseClass} bg-slate-50/40 dark:bg-slate-900/20`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Prata (Grama)</CardTitle>
          <Coins className="h-4 w-4 text-slate-400 shrink-0" />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-0">
          <div
            className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-600 dark:text-slate-300 font-mono tracking-tight truncate"
            title={formatCurrency(data.silverPricePerGramBRL)}
          >
            {formatCurrency(data.silverPricePerGramBRL)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">Sincronizado às {lastUpdate}</p>
        </CardContent>
      </Card>
    </>
  );
}
