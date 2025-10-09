"use client";

import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function DataFixing() {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isBackfillingTransactions, setIsBackfillingTransactions] = useState(false);
  const [isLinkingSales, setIsLinkingSales] = useState(false);
  const [isBackfillingAdjustments, setIsBackfillingAdjustments] = useState(false);
  const [isBackfillingQuotations, setIsBackfillingQuotations] = useState(false);
  const [isBackfillingGoldValue, setIsBackfillingGoldValue] = useState(false);
  const [isFixingReactionGroup, setIsFixingReactionGroup] = useState(false);
  const [isBackfillingCosts, setIsBackfillingCosts] = useState(false);

  const handleLinkSalesReceivables = async () => {
    setIsLinkingSales(true);
    const promise = api.post("/json-imports/link-sales-receivables");
    toast.promise(promise, {
      loading: "Vinculando vendas e recebimentos...",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha ao vincular dados.",
      finally: () => setIsLinkingSales(false),
    });
  };

  const handleBackfillAdjustments = async () => {
    setIsBackfillingAdjustments(true);
    const promise = api.post("/sales/backfill-adjustments");
    toast.promise(promise, {
      loading: "Calculando ajustes para vendas finalizadas...",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha ao calcular ajustes.",
      finally: () => setIsBackfillingAdjustments(false),
    });
  };

  const handleBackfillQuotations = async () => {
    console.log('EXECUTANDO PASSO 1: Preencher Cotações');
    setIsBackfillingQuotations(true);
    const promise = api.post("/sales/backfill-quotations");
    toast.promise(promise, {
      loading: "Preenchendo cotações para vendas antigas...",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha ao preencher cotações.",
      finally: () => setIsBackfillingQuotations(false),
    });
  };

  const handleBackfillGoldValue = async () => {
    console.log('EXECUTANDO PASSO 0: Sincronizar Totais');
    setIsBackfillingGoldValue(true);
    const promise = api.post("/sales/backfill-gold-value");
    toast.promise(promise, {
      loading: "Preenchendo quantidade de ouro (g) em vendas antigas...",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha ao preencher dados.",
      finally: () => setIsBackfillingGoldValue(false),
    });
  };

  const handleFixReactionGroupFlag = async () => {
    setIsFixingReactionGroup(true);
    const promise = api.post("/products/fix-reaction-group");
    toast.promise(promise, {
      loading: "Corrigindo classificação do grupo de ouro...",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha ao corrigir classificação.",
      finally: () => setIsFixingReactionGroup(false),
    });
  };

  const handleBackfillCosts = async () => {
    setIsBackfillingCosts(true);
    const promise = api.post("/sales/backfill-costs");
    toast.promise(promise, {
      loading: "Recalculando custos de vendas antigas...",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha ao corrigir custos.",
      finally: () => setIsBackfillingCosts(false),
    });
  };

  const handleBackfillReceivables = async () => {
    setIsBackfilling(true);
    const promise = api.post("/sale-adjustments/backfill-receivables");
    toast.promise(promise, {
      loading: "Corrigindo vínculos de recebimentos...",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha ao corrigir vínculos.",
      finally: () => setIsBackfilling(false),
    });
  };

  const handleBackfillTransactions = async () => {
    setIsBackfillingTransactions(true);
    const promise = api.post("/sale-adjustments/backfill-transactions");
    toast.promise(promise, {
      loading: "Corrigindo vínculos de transações...",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha ao corrigir vínculos.",
      finally: () => setIsBackfillingTransactions(false),
    });
  };

  return (
    <div className="flex flex-wrap gap-8 justify-center items-start">
      <Card className="w-full max-w-lg border-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-700">Corrigir Vínculos de Recebimentos</CardTitle>
          <CardDescription>
            Esta ação verifica todos os recebimentos pagos e preenche a informação da conta corrente caso esteja faltando, baseado na transação original.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleBackfillReceivables}
            disabled={isBackfilling}
            className="w-full"
          >
            {isBackfilling
              ? "Corrigindo..."
              : "Corrigir Vínculos de Contas (Recebimentos)"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-purple-500">
        <CardHeader>
          <CardTitle className="text-purple-700">Corrigir Vínculos de Transações</CardTitle>
          <CardDescription>
            Esta ação verifica todas as transações e preenche a conta corrente caso esteja faltando, baseado no recebimento associado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleBackfillTransactions}
            disabled={isBackfillingTransactions}
            className="w-full"
          >
            {isBackfillingTransactions
              ? "Corrigindo..."
              : "Corrigir Vínculos de Contas (Transações)"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-green-500">
        <CardHeader>
          <CardTitle className="text-green-700">Vincular Vendas e Recebimentos</CardTitle>
          <CardDescription>
            Esta ação lê os arquivos JSON de pedidos e duplicatas, vincula os recebimentos às vendas correspondentes e atualiza o status das vendas quitadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleLinkSalesReceivables}
            disabled={isLinkingSales}
            className="w-full"
          >
            {isLinkingSales
              ? "Vinculando..."
              : "Vincular Vendas e Recebimentos"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-red-500">
        <CardHeader>
          <CardTitle className="text-red-700">Passo -1: Corrigir Classificação do Grupo de Ouro</CardTitle>
          <CardDescription>
            Marca o grupo 'Aurocianeto 68%' como um grupo de produto de reação. Essencial para o Passo 0 funcionar corretamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleFixReactionGroupFlag}
            disabled={isFixingReactionGroup}
            className="w-full"
          >
            {isFixingReactionGroup
              ? "Corrigindo..."
              : "Corrigir Classificação"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-orange-500">
        <CardHeader>
          <CardTitle className="text-orange-700">Passo 0: Sincronizar Totais de Ouro das Vendas</CardTitle>
          <CardDescription>
            Soma as quantidades dos itens de ouro de cada venda e salva o total no pedido. Essencial para os cálculos de lucro. Não usa arquivos externos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleBackfillGoldValue}
            disabled={isBackfillingGoldValue}
            className="w-full"
          >
            {isBackfillingGoldValue
              ? "Sincronizando..."
              : "Sincronizar Totais"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-cyan-500">
        <CardHeader>
          <CardTitle className="text-cyan-700">Passo 1: Preencher Cotações de Vendas Antigas</CardTitle>
          <CardDescription>
            Busca a transação de cada venda antiga, calcula a cotação real e a salva no pedido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleBackfillQuotations}
            disabled={isBackfillingQuotations}
            className="w-full"
          >
            {isBackfillingQuotations
              ? "Preenchendo..."
              : "Preencher Cotações"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-yellow-500">
        <CardHeader>
          <CardTitle className="text-yellow-700">Passo 2: Calcular Ajustes de Vendas Antigas</CardTitle>
          <CardDescription>
            Calcula o lucro/prejuízo da cotação para todas as vendas já finalizadas que ainda não possuem este cálculo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleBackfillAdjustments}
            disabled={isBackfillingAdjustments}
            className="w-full"
          >
            {isBackfillingAdjustments
              ? "Calculando..."
              : "Processar Vendas Antigas"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-teal-500">
        <CardHeader>
          <CardTitle className="text-teal-700">Corrigir Custos de Vendas Antigas</CardTitle>
          <CardDescription>
            Esta ação recalcula o `totalCost` para todas as vendas que contêm produtos de reação (como Sal 68%), aplicando a nova regra de cálculo de lucro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleBackfillCosts}
            disabled={isBackfillingCosts}
            className="w-full"
          >
            {isBackfillingCosts
              ? "Corrigindo Custos..."
              : "Corrigir Custos de Vendas"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
