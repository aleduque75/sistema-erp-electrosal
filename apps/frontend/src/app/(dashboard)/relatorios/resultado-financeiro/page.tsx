"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FinancialBalanceReport,
  getFinancialBalanceReport,
  SingleMetalReport,
} from "@/services/reportsApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, DollarSign, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinancialBalanceReportPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [goldPrice, setGoldPrice] = useState<string>('');
  const [reportData, setReportData] = useState<FinancialBalanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione as datas inicial e final.");
      return;
    }
    setIsLoading(true);
    setReportData(null);
    try {
      const params = {
        startDate,
        endDate,
        goldPrice: goldPrice ? parseFloat(goldPrice) : undefined,
      };
      const data = await getFinancialBalanceReport(params);
      setReportData(data);
    } catch (error) {
      toast.error("Erro ao gerar relatório.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatGrams = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }) + " g";
  };

  const renderMetalReport = (metal: string, data: SingleMetalReport) => (
    <div className="space-y-6 mt-4">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/10 border-primary/20 col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">Resultado Líquido ({metal})</CardTitle>
            <TrendingUp className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(data.netResultValue)}</div>
            <p className="text-lg text-muted-foreground font-medium">
              {formatGrams(data.netResultGrams)}
            </p>
          </CardContent>
        </Card>
        
         <Card className="bg-muted/50 border-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotação Utilizada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.priceUsed)}</div>
            <p className="text-xs text-muted-foreground">por grama de {metal}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Aberto (Pipeline)</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatGrams(data.totalPendingAnalysisGrams)}</div>
            <p className="text-xs text-muted-foreground">
               Est. {formatCurrency(data.totalPendingAnalysisValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Receitas */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita de Recuperação</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRecoveredValue)}</div>
            <p className="text-sm text-muted-foreground">
              {formatGrams(data.totalRecoveredGrams)}
            </p>
          </CardContent>
        </Card>

        {/* Consumo */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo em Reações</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalReactionConsumptionValue)}</div>
             <p className="text-sm text-muted-foreground">
              {formatGrams(data.totalReactionConsumptionGrams)}
            </p>
          </CardContent>
        </Card>

        {/* Custos */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Metal Cliente</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalClientCreditValue)}</div>
             <p className="text-sm text-muted-foreground">
              {formatGrams(data.totalClientCreditGrams)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perda com Resíduos</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalResidueValue)}</div>
             <p className="text-sm text-muted-foreground">
              {formatGrams(data.totalResidueGrams)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matéria Prima</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRawMaterialsCost)}</div>
            <p className="text-sm text-muted-foreground">
              ~ {formatGrams(data.totalRawMaterialsGrams)}
            </p>
          </CardContent>
        </Card>

         <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCommissions)}</div>
             <p className="text-sm text-muted-foreground">
              ~ {formatGrams(data.totalCommissionsGrams)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resultado Financeiro</h1>
        <p className="text-muted-foreground">
          Visão consolidada de receitas de recuperação, pagamentos e custos por metal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
          <div className="grid gap-2">
            <Label>Data Inicial</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Data Final</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Preço do Ouro (R$/g) <span className="text-xs text-muted-foreground">(Opcional, apenas AU)</span></Label>
            <Input 
              type="number" 
              placeholder="Ex: 350.00" 
              value={goldPrice} 
              onChange={(e) => setGoldPrice(e.target.value)} 
            />
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
            {isLoading ? "Calculando..." : "Gerar Resultado"}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
         <Tabs defaultValue="AU" className="w-full">
            <TabsList>
                {Object.keys(reportData).map(metal => (
                    <TabsTrigger key={metal} value={metal}>{metal}</TabsTrigger>
                ))}
            </TabsList>
            {Object.entries(reportData).map(([metal, data]) => (
                <TabsContent key={metal} value={metal}>
                    {renderMetalReport(metal, data)}
                </TabsContent>
            ))}
         </Tabs>
      )}
    </div>
  );
}
