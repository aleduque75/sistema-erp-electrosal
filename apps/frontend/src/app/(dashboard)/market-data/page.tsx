"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import { MarketDataChart } from "@/components/market-data-chart";

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

export default function MarketDataPage() {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await api.get(`/market-data?${params.toString()}`);
      setMarketData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de mercado:", error);
      toast.error("Erro ao carregar dados de mercado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await api.post("/market-data/sync");
      toast.success(`Sincronização concluída! ${response.data.count} registros processados.`);
      fetchMarketData();
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
      toast.error("Erro ao sincronizar dados com o mercado.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const formatCurrencyBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatCurrencyUSD = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

  const formatNumber = (value: number, decimals = 4) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value || 0);

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dados de Mercado</h1>
          <p className="text-muted-foreground">Histórico de Dólar, Ouro e Prata com conversões para Grama/Real.</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar Dados"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end-date">Data Final</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchMarketData} disabled={isLoading}>Filtrar</Button>
              <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); fetchMarketData(); }}>Limpar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {marketData.length > 0 && <MarketDataChart data={marketData} />}

      <Card>
        <CardHeader>
          <CardTitle>Cotações e Conversões</CardTitle>
          <CardDescription>
            Cálculo: (Preço Troy / 31.1035) * Dólar = Preço por Grama em R$
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marketData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Dólar (R$)</TableHead>
                  <TableHead>Ouro (USD/oz)</TableHead>
                  <TableHead>Prata (USD/oz)</TableHead>
                  <TableHead className="bg-yellow-50 dark:bg-yellow-950/20">Ouro (R$/g)</TableHead>
                  <TableHead className="bg-slate-50 dark:bg-slate-900/20">Prata (R$/g)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{formatNumber(item.usdPrice, 4)}</TableCell>
                    <TableCell>{formatCurrencyUSD(item.goldTroyPrice)}</TableCell>
                    <TableCell>{formatCurrencyUSD(item.silverTroyPrice)}</TableCell>
                    <TableCell className="font-bold bg-yellow-50 dark:bg-yellow-950/20">
                      {formatCurrencyBRL(item.goldPricePerGramBRL)}
                    </TableCell>
                    <TableCell className="font-bold bg-slate-50 dark:bg-slate-900/20">
                      {formatCurrencyBRL(item.silverPricePerGramBRL)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-10 text-muted-foreground">Nenhum dado encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
