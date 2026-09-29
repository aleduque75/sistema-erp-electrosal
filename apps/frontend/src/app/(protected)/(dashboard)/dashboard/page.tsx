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
  const [loading, setIsPageLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, cashFlowRes, salesRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/cash-flow-summary"),
        api.get("/sales?limit=5"),
      ]);
      setSummaryData(summaryRes.data);
      setCashFlowData(cashFlowRes.data);
      setRecentSales(salesRes.data?.data || (Array.isArray(salesRes.data) ? salesRes.data : []));
    } catch {
      toast.error("Falha ao carregar os dados do dashboard.");
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <p className="p-10 text-center">Carregando dashboard...</p>;
  }

  return (
    <div className="space-y-6 p-3 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>

      {summaryData && !summaryData.todayQuotationRegistered && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-sm animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-500 dark:text-amber-400">
                Cotação do Dia Pendente!
              </h4>
              <p className="text-xs text-amber-600/90 dark:text-amber-300/90 mt-0.5">
                Você ainda não registrou a cotação manual de ouro para hoje. Os novos lançamentos podem usar valores desatualizados.
              </p>
            </div>
          </div>
          <NovaQuotationModal
            onSaveSuccess={fetchData}
            trigger={
              <button className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 dark:text-amber-300 hover:underline px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0">
                Registrar agora <ArrowRight className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>
      )}

      {/* Implementação das Tabs para organizar as visões */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/40 h-10">
          <TabsTrigger value="overview" className="rounded-lg px-4 text-xs font-semibold">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="balanco-ouro" className="rounded-lg px-4 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Balanço em Ouro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
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