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

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DashboardSummary {
  totalProducts: number;
  totalAccountsPay: number;
  totalAccountsRec: number;
  totalStockValue: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (user) {
        try {
          setSummaryLoading(true);
          const response = await api.get("/dashboard/summary");
          setSummary(response.data);
        } catch (err: any) {
          console.error("Failed to fetch dashboard summary:", err);
          setSummaryError("Erro ao carregar o resumo do dashboard.");
        } finally {
          setSummaryLoading(false);
        }
      }
    };
    fetchSummary();
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

  if (loading || summaryLoading) {
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

      {summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Card: Produtos em Estoque */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-lg border border-gray-200">
            <CardHeader className="p-0 mb-4">
              <Package className="h-12 w-12 text-blue-500 mb-2" />
              <CardTitle className="text-lg font-semibold text-gray-700">
                Produtos em Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-blue-600">
                {summary.totalProducts !== undefined
                  ? summary.totalProducts
                  : 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">itens</p>
            </CardContent>
          </Card>

          {/* Card: Valor Total do Estoque */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-lg border border-gray-200">
            <CardHeader className="p-0 mb-4">
              <DollarSign className="h-12 w-12 text-purple-500 mb-2" />
              <CardTitle className="text-lg font-semibold text-gray-700">
                Valor Total do Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-purple-600">
                {formatCurrency(summary.totalStockValue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">valor de compra</p>
            </CardContent>
          </Card>

          {/* Card: Contas a Pagar (Não Pago) */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-lg border border-gray-200">
            <CardHeader className="p-0 mb-4">
              {/* Ícone CORRIGIDO para contas a pagar */}
              <ArrowDownToLine className="h-12 w-12 text-red-500 mb-2" />
              {/* Ou use TrendingDown, por exemplo: <TrendingDown className="h-12 w-12 text-red-500 mb-2" /> */}
              <CardTitle className="text-lg font-semibold text-gray-700">
                Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-red-600">
                {formatCurrency(summary.totalAccountsPay)}
              </p>
              <p className="text-sm text-gray-500 mt-1">pendente</p>
            </CardContent>
          </Card>

          {/* Card: Contas a Receber (Não Recebido) */}
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-lg border border-gray-200">
            <CardHeader className="p-0 mb-4">
              {/* Ícone CORRIGIDO para contas a receber */}
              <ArrowUpToLine className="h-12 w-12 text-green-500 mb-2" />
              {/* Ou use TrendingUp, por exemplo: <TrendingUp className="h-12 w-12 text-green-500 mb-2" /> */}
              <CardTitle className="text-lg font-semibold text-gray-700">
                Contas a Receber
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-green-600">
                {formatCurrency(summary.totalAccountsRec)}
              </p>
              <p className="text-sm text-gray-500 mt-1">pendente</p>
            </CardContent>
          </Card>

          {/* Exemplo de Card extra para você adicionar se quiser: Saldo em Caixa */}
          <Card
            className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border border-gray-200
             bg-yellow-100 dark:bg-yellow-900 
             text-yellow-800 dark:text-yellow-200"
          >
            {" "}
            <CardHeader className="p-0 mb-4">
              <HandCoins className="h-12 w-12 text-yellow-500 mb-2" />
              <CardTitle className="text-lg font-semibold text-gray-700">
                Saldo em Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl font-extrabold text-yellow-600">
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
    </div>
  );
}
