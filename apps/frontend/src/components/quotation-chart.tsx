"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface QuotationData {
  date: string;
  buyPrice: number;
  sellPrice: number;
}

export function QuotationChart() {
  const [data, setData] = useState<QuotationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuotations = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/quotations");
        const rawQuotations = response.data;

        // Filtrar e formatar dados desde 2020
        const filteredData = rawQuotations
          .filter((q: any) => new Date(q.date) >= new Date("2020-01-01"))
          .map((q: any) => ({
            date: format(new Date(q.date), "MMM yyyy"), // Formato para exibição no gráfico
            buyPrice: q.buyPrice,
            sellPrice: q.sellPrice,
          }))
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ordenar por data

        setData(filteredData);
      } catch (error) {
        toast.error("Falha ao carregar dados de cotação.");
        console.error("Erro ao carregar cotações:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cotações de Metais (Au)</CardTitle>
          <CardDescription>Histórico de preços de compra e venda desde 2020.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p>Carregando dados do gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cotações de Metais (Au)</CardTitle>
        <CardDescription>Histórico de preços de compra e venda desde 2020.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="buyPrice" stroke="#8884d8" fillOpacity={1} fill="url(#colorBuy)" />
              <Area type="monotone" dataKey="sellPrice" stroke="#82ca9d" fillOpacity={1} fill="url(#colorSell)" />
              <defs>
                <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
