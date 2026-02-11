"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Interface para os dados do gráfico
interface ChartData {
  name: string;
  total: number;
}

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export function CategoryChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Busca os dados agrupados da API
        const response = await api.get('/accounts-pay/summary/by-category');
        
        // Formata os dados para o que o Recharts espera
        interface ApiCategory {
          contaContabil?: {
            nome?: string;
          };
          _sum: {
            amount: number | string;
          };
        }

        const responseTyped: { data: ApiCategory[] } = response;

        const formattedData: ChartData[] = responseTyped.data.map((item: ApiCategory) => ({
          name: item.contaContabil?.nome || 'Sem Categoria', // Usa o nome da conta contábil
          total: Number(item._sum.amount),
        }));
        setData(formattedData);
      } catch (error) {
        toast.error("Erro ao carregar dados do gráfico.");
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchChartData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Resumo das contas a pagar pendentes.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p>Carregando gráfico...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ 
                  background: 'hsl(var(--background))', 
                  borderColor: 'hsl(var(--border))' 
                }}
                formatter={(value: number) => [formatCurrency(value), 'Total']}
              />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}