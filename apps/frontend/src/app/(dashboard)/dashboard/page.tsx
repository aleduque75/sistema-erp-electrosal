"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Adicionado importação de Tabs

import { KpiCards } from "@/components/kpi-cards";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { RecentSales } from "@/components/recent-sales";
import { ThirdPartyLoansCard } from "./third-party-loans-card";
import { TotalSalesChart } from "@/components/dashboard/total-sales-chart";
import { QuotationChart } from "@/components/quotation-chart";
import { MarketDataCards } from "@/components/market-data-cards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight } from "lucide-react";
import { NovaQuotationModal } from "@/components/quotations/NovaQuotationModal";
import { GoldBalanceTab } from "./gold-balance-tab"; // Importação do novo componente

export default function DashboardPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, cashFlowRes, salesRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/cash-flow-summary"),
        api.get("/sales?limit=5"),
      ]);
      setSummaryData(summaryRes.data);
      setCashFlowData(cashFlowRes.data);
      setRecentSales(salesRes.data);
    } catch {
      toast.error("Falha ao carregar os dados do dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <p className="p-10 text-center">Carregando dashboard...</p>;
  }

  return (
    <div className="space-y-8 md:p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {summaryData && !summaryData.todayQuotationRegistered && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cotação do Dia Pendente!</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Você ainda não registrou a cotação manual de ouro para hoje. Os novos lançamentos podem usar valores desatualizados.</span>
            <NovaQuotationModal
              onSaveSuccess={fetchData}
              trigger={
                <button className="flex items-center gap-1 font-bold underline hover:text-primary">
                  Registrar agora <ArrowRight className="h-4 w-4" />
                </button>
              }
            />
          </AlertDescription>
        </Alert>
      )}

      {/* Implementação das Tabs para organizar as visões */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="balanco-ouro" className="text-yellow-600 dark:text-yellow-400 font-semibold">
            Balanço em Ouro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {summaryData && <KpiCards data={summaryData} />}
            <ThirdPartyLoansCard />
            <MarketDataCards />
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <CashFlowChart data={cashFlowData} />
            </div>
            <div className="lg:col-span-3">
              <RecentSales data={recentSales} />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <div className="lg:col-span-1">
              <TotalSalesChart />
            </div>
            <div className="lg:col-span-1">
              <QuotationChart />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="balanco-ouro">
          <GoldBalanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}