"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RawQuotation {
  date: string;
  buyPrice: number;
  sellPrice: number;
  metal: "AU" | "AG" | string;
}

interface ProcessedData {
  date: string;
  dateObj: Date;
  GOLD_buyPrice?: number;
  GOLD_sellPrice?: number;
  SILVER_buyPrice?: number;
  SILVER_sellPrice?: number;
}

export function QuotationChart() {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [loading, setIsPageLoading] = useState(true);
  const [selectedMetal, setSelectedMetal] = useState<"BOTH" | "GOLD" | "SILVER">(
    "GOLD"
  );

  useEffect(() => {
    const fetchQuotations = async () => {
      setIsPageLoading(true);
      try {
        const response = await api.get("/quotations");
        const rawQuotations: RawQuotation[] = response.data;

        const groupedByMonth = rawQuotations
          .filter(
            (q) =>
              new Date(q.date) >= new Date("2020-01-01") &&
              (q.metal === "AU" || q.metal === "AG")
          )
          .reduce((acc, q) => {
            const quoteDate = new Date(q.date);
            if (isNaN(quoteDate.getTime())) {
              return acc;
            }
            const monthStart = startOfMonth(quoteDate);
            const dateKey = monthStart.toISOString();

            if (!acc[dateKey]) {
              acc[dateKey] = { dateObj: monthStart };
            }

            const metalKey = q.metal === "AU" ? "GOLD" : "SILVER";
            acc[dateKey][`${metalKey}_buyPrice`] = parseFloat(
              q.buyPrice as any
            );
            acc[dateKey][`${metalKey}_sellPrice`] = parseFloat(
              q.sellPrice as any
            );
            return acc;
          }, {} as Record<string, Partial<ProcessedData>>);

        const sortedData = Object.values(groupedByMonth)
          .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime())
          .map((item) => ({
            ...item,
            date: format(item.dateObj!, "MMM yyyy", { locale: ptBR }),
          }));

        setData(sortedData as ProcessedData[]);
      } catch (error) {
        toast.error("Falha ao carregar dados de cotação.");
        console.error("Erro ao carregar cotações:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cotações de Metais (Au e Ag)</CardTitle>
          <CardDescription>
            Histórico de preços de compra e venda desde 2020.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p>Carregando dados do gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-md">
          <p className="label">{`${label}`}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {`${pld.name}: ${
                pld.value
                  ? pld.value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "N/A"
              }`}
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Cotações de Metais</CardTitle>
          <CardDescription>
            Histórico de preços de compra e venda desde 2020.
          </CardDescription>
        </div>
        <Select
          value={selectedMetal}
          onValueChange={(value) =>
            setSelectedMetal(value as "BOTH" | "GOLD" | "SILVER")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecionar Metal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BOTH">Ambos</SelectItem>
            <SelectItem value="GOLD">Ouro</SelectItem>
            <SelectItem value="SILVER">Prata</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {/* Gold */}
              {(selectedMetal === "BOTH" || selectedMetal === "GOLD") && (
                <>
                  <Area
                    type="monotone"
                    dataKey="GOLD_buyPrice"
                    name="Ouro (Compra)"
                    stroke="#FFD700"
                    fill="url(#colorGoldBuy)"
                    fillOpacity={0.6}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="GOLD_sellPrice"
                    name="Ouro (Venda)"
                    stroke="#B8860B"
                    fill="url(#colorGoldSell)"
                    fillOpacity={0.6}
                    connectNulls
                  />
                </>
              )}
              {/* Silver */}
              {(selectedMetal === "BOTH" || selectedMetal === "SILVER") && (
                <>
                  <Area
                    type="monotone"
                    dataKey="SILVER_buyPrice"
                    name="Prata (Compra)"
                    stroke="#C0C0C0"
                    fill="url(#colorSilverBuy)"
                    fillOpacity={0.6}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="SILVER_sellPrice"
                    name="Prata (Venda)"
                    stroke="#A9A9A9"
                    fill="url(#colorSilverSell)"
                    fillOpacity={0.6}
                    connectNulls
                  />
                </>
              )}
              <defs>
                <linearGradient id="colorGoldBuy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGoldSell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B8860B" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#B8860B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSilverBuy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C0C0C0" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#C0C0C0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSilverSell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A9A9A9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#A9A9A9" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
