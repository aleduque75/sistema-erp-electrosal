"use client";

import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Coins, DollarSign, Scale } from "lucide-react";

interface MarketDataItem {
  id: string;
  date: string;
  usdPrice: number;
  goldTroyPrice: number;
  silverTroyPrice: number;
  goldPricePerGramUSD: number;
  silverPricePerGramUSD: number;
  goldPricePerGramBRL: number;
  silverPricePerGramBRL: number;
}

interface MarketDataChartProps {
  data: MarketDataItem[];
}

export function MarketDataChart({ data }: MarketDataChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["GOLD", "SILVER", "USD"]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const chartData = useMemo(() => {
    return sortedData.map((item) => ({
      ...item,
      formattedDate: format(new Date(item.date), "dd/MM/yy", { locale: ptBR }),
      ouro: Number(item.goldPricePerGramBRL),
      prata: Number(item.silverPricePerGramBRL),
      dolar: Number(item.usdPrice),
    }));
  }, [sortedData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-3 rounded-md shadow-md space-y-1">
          <p className="font-bold border-b pb-1 mb-1 text-xs">{label}</p>
          {payload.map((pld: any) => (
            <div key={pld.dataKey} className="flex justify-between gap-4 text-xs">
              <span style={{ color: pld.color }}>{pld.name}:</span>
              <span className="font-mono">
                {pld.value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: pld.dataKey === 'dolar' ? 4 : 2
                })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Histórico de Preços</CardTitle>
          <CardDescription>
            Escolha as cotações para visualizar no gráfico.
          </CardDescription>
        </div>
        <ToggleGroup 
          type="multiple" 
          value={selectedMetrics} 
          onValueChange={(value) => value.length > 0 && setSelectedMetrics(value)}
          className="justify-start border rounded-md p-1 bg-muted/20"
        >
          <ToggleGroupItem value="GOLD" aria-label="Toggle Ouro" className="gap-2 px-3 data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700">
            <Scale className="h-4 w-4" /> Ouro
          </ToggleGroupItem>
          <ToggleGroupItem value="SILVER" aria-label="Toggle Prata" className="gap-2 px-3 data-[state=on]:bg-slate-200 data-[state=on]:text-slate-700">
            <Coins className="h-4 w-4" /> Prata
          </ToggleGroupItem>
          <ToggleGroupItem value="USD" aria-label="Toggle Dólar" className="gap-2 px-3 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700">
            <DollarSign className="h-4 w-4" /> Dólar
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10 }}
                minTickGap={30}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10, fill: "#b45309" }}
                tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
                label={{ value: 'Ouro (R$/g)', angle: -90, position: 'insideLeft', fontSize: 10, fill: "#b45309" }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "#475569" }}
                tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                label={{ value: 'Prata / Dólar', angle: 90, position: 'insideRight', fontSize: 10, fill: "#475569" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36}/>
              
              {selectedMetrics.includes("GOLD") && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ouro"
                  name="Ouro (R$/g)"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )}
              
              {selectedMetrics.includes("SILVER") && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="prata"
                  name="Prata (R$/g)"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )}

              {selectedMetrics.includes("USD") && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="dolar"
                  name="Dólar (USD/BRL)"
                  stroke="#2563eb"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
