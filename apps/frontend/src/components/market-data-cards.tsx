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

  return (
    <>
      <Card className="bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dólar (Comercial)</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.usdPrice, 4)}</div>
          <p className="text-[10px] text-muted-foreground">Atualizado às {lastUpdate}</p>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ouro (Grama)</CardTitle>
          <Scale className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.goldPricePerGramBRL)}</div>
          <p className="text-[10px] text-muted-foreground">Sincronizado às {lastUpdate}</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-50 dark:bg-slate-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Prata (Grama)</CardTitle>
          <Coins className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.silverPricePerGramBRL)}</div>
          <p className="text-[10px] text-muted-foreground">Sincronizado às {lastUpdate}</p>
        </CardContent>
      </Card>
    </>
  );
}
