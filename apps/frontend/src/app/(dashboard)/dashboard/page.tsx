// apps/frontend/src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

// Ícones corrigidos e outros que podem ser úteis:
import {
  Package,
  DollarSign,
  ArrowUpToLine,
  ArrowDownToLine,
  HandCoins,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DashboardSummary {
  totalProducts: number;
  totalAccountsPay: number;
  totalAccountsRec: number;
  totalStockValue: number;
}

interface AccountsPayStatusEntry {
  name: string;
  value: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [creditCardExpenses, setCreditCardExpenses] = useState([]);
  const [accountsPayStatus, setAccountsPayStatus] = useState<AccountsPayStatusEntry[]>([]);
  const [cashFlowSummary, setCashFlowSummary] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsError, setChartsError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSummaryAndCharts = async () => {
      if (user) {
        try {
          setSummaryLoading(true);
          setChartsLoading(true);

          const [
            summaryResponse,
            ccExpensesResponse,
            apStatusResponse,
            cfSummaryResponse,
          ] = await Promise.all([
            api.get("/dashboard/summary"),
            api.get("/dashboard/credit-card-expenses-by-month"),
            api.get("/dashboard/accounts-pay-status"),
            api.get("/dashboard/cash-flow-summary"),
          ]);

          setSummary(summaryResponse.data);
          setCreditCardExpenses(ccExpensesResponse.data);
          setAccountsPayStatus(apStatusResponse.data);
          setCashFlowSummary(cfSummaryResponse.data);
        } catch (err: any) {
          console.error("Failed to fetch dashboard data:", err);
          setSummaryError("Erro ao carregar o resumo do dashboard.");
          setChartsError("Erro ao carregar dados dos gráficos.");
        } finally {
          setSummaryLoading(false);
          setChartsLoading(false);
        }
      }
    };
    fetchSummaryAndCharts();
  }, [user]);

  const formatCurrency = (value: number) => {
    if (value === undefined || value === null) {
      return "R$ 0,00";
    }
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (loading || summaryLoading || chartsLoading) {
    return <p className="text-center text-lg mt-10">Carregando dashboard...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        Visão Geral do Sistema
      </h1>
      <p className="text-xl mb-6 text-center text-gray-600">
        Bem-vindo(a),{" "}
        <span className="font-semibold text-blue-700">{user.name}</span>!
      </p>

      {summaryError && (
        <p className="text-red-500 text-center mb-6">{summaryError}</p>
      )}
      {chartsError && (
        <p className="text-red-500 text-center mb-6">{chartsError}</p>
      )}

      {summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Card: Produtos em Estoque */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg border border-gray-300 bg-zinc-100">
            <CardHeader className="p-0 mb-4">
              <Package className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle className="text-lg font-semibold text-gray-700">
                Produtos em Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-blue-700">
                {summary.totalProducts !== undefined
                  ? summary.totalProducts
                  : 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">itens</p>
            </CardContent>
          </Card>

          {/* Card: Valor Total do Estoque */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg border border-gray-300 bg-zinc-100">
            <CardHeader className="p-0 mb-4">
              <DollarSign className="h-12 w-12 text-purple-600 mb-2" />
              <CardTitle className="text-lg font-semibold text-gray-700">
                Valor Total do Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-purple-700">
                {formatCurrency(summary.totalStockValue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">valor de compra</p>
            </CardContent>
          </Card>

          {/* Card: Contas a Pagar (Não Pago) */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg border border-gray-300 bg-zinc-100">
            <CardHeader className="p-0 mb-4">
              <ArrowDownToLine className="h-12 w-12 text-red-600 mb-2" />
              <CardTitle className="text-lg font-semibold text-gray-700">
                Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-red-700">
                {formatCurrency(summary.totalAccountsPay)}
              </p>
              <p className="text-sm text-gray-500 mt-1">pendente</p>
            </CardContent>
          </Card>

          {/* Card: Contas a Receber (Não Recebido) */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg border border-gray-300 bg-zinc-100">
            {" "}
            <CardHeader className="p-0 mb-4">
              <ArrowUpToLine className="h-12 w-12 text-green-600 mb-2" />
              <CardTitle className="text-lg font-semibold text-gray-700">
                Contas a Receber
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-green-700">
                {formatCurrency(summary.totalAccountsRec)}
              </p>
              <p className="text-sm text-gray-500 mt-1">pendente</p>
            </CardContent>
          </Card>

          {/* Exemplo de Card extra para você adicionar se quiser: Saldo em Caixa */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg border border-gray-300 bg-zinc-100">
            {" "}
            <CardHeader className="p-0 mb-4">
              <HandCoins className="h-12 w-12 text-yellow-600 mb-2" />
              <CardTitle className="text-lg font-semibold text-gray-700">
                Saldo em Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-yellow-700">
                R$ 0,00 {/* Valor placeholder */}
              </p>
              <p className="text-sm text-gray-500 mt-1">disponível</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">
          Nenhum dado de resumo disponível.
        </p>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Gráfico de Despesas de Cartão de Crédito por Mês */}
        <Card className=" border-gray-300 bg-zinc-100">
          <CardHeader>
            <CardTitle>
              Despesas de Cartão de Crédito (Últimos 6 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditCardExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={creditCardExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#4A90E2" name="Total Gasto" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">
                Nenhum dado de despesa de cartão de crédito.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Status de Contas a Pagar */}
        <Card className=" border-gray-300 bg-zinc-100">
          <CardHeader>
            <CardTitle>Status das Contas a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            {accountsPayStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={accountsPayStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60} // Adiciona o raio interno para criar o efeito de donut
                    fill="#8884d8"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`} // Mostra a porcentagem no rótulo
                  >
                    {accountsPayStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Pagos' ? '#50C878' : '#FF6347'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">
                Nenhum dado de contas a pagar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Resumo de Fluxo de Caixa */}
        <Card className="lg:col-span-2 bg-slate-50">
          <CardHeader>
            <CardTitle>Fluxo de Caixa (Últimos 6 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {cashFlowSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlowSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="incomes"
                    stroke="#50C878"
                    name="Receitas"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#FF6347"
                    name="Despesas"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">
                Nenhum dado de fluxo de caixa.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
