"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

// Vamos criar estes componentes nos próximos passos
import { KpiCards } from "@/components/kpi-cards";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { RecentSales } from "@/components/recent-sales";
import { ThirdPartyLoansCard } from "./third-party-loans-card";
import { TotalSalesChart } from "@/components/dashboard/total-sales-chart";
import { QuotationChart } from "@/components/quotation-chart";
import { MarketDataCards } from "@/components/market-data-cards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Replace 'any' with the actual KpiData type if available
  const [summaryData, setSummaryData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Busca todos os dados do dashboard em paralelo
        const [summaryRes, cashFlowRes, salesRes] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/dashboard/cash-flow-summary"),
          api.get("/sales?limit=5"), // Pede apenas as últimas 5 vendas
        ]);
        setSummaryData(summaryRes.data);
        setCashFlowData(cashFlowRes.data);
        setRecentSales(salesRes.data);
      } catch {
        toast.error("Falha ao carregar os dados do dashboard.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <p className="p-10 text-center">Carregando dashboard...</p>;
  }

  return (
    <div className="space-y-8  md:p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {summaryData && !summaryData.todayQuotationRegistered && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cotação do Dia Pendente!</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Você ainda não registrou a cotação manual de ouro para hoje. Os novos lançamentos podem usar valores desatualizados.</span>
            <Link href="/quotations" className="flex items-center gap-1 font-bold underline">
              Registrar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Grid principal que organiza os elementos */}
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
    </div>
  );
}
