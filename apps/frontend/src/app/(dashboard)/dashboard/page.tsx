"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

// Vamos criar estes componentes nos próximos passos
import { KpiCards } from "@/components/kpi-cards";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { RecentSales } from "@/components/recent-sales";
import { CreditCardForecastChart } from "./credit-card-forecast-chart";
import { ThirdPartyLoansCard } from "./third-party-loans-card";

export default function DashboardPage() {
  const [summaryData, setSummaryData] = useState(null);
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

      {/* Grid principal que organiza os elementos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCards data={summaryData} />
        <ThirdPartyLoansCard />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <CashFlowChart data={cashFlowData} />
        </div>
        <div className="lg:col-span-3">
          <RecentSales data={recentSales} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-7">
          <CreditCardForecastChart />
        </div>
      </div>
    </div>
  );
}
