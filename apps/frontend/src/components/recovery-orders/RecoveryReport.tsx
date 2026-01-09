
"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { getRecoveryOrders } from "@/services/recoveryOrdersApi";
import { RecoveryOrder } from "@/types/recovery-order";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ReportData {
  totalRecuperado: number;
  totalPagoCliente: number;
  totalGastoMaterial: number;
  totalComissao: number;
  totalARecuperar: number;
  lucro: number;
}

export function RecoveryReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Selecione um período para gerar o relatório.");
      return;
    }

    setIsLoading(true);
    try {
      const orders = await getRecoveryOrders({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });
      console.log('Fetched Orders for Report:', orders);

      const aggregatedData = orders.reduce(
        (acc, order) => {
          acc.totalRecuperado += order.auPuroRecuperadoGramas || 0;
          acc.totalPagoCliente += order.analisesEnvolvidas?.reduce((sum, analise) => sum + (analise.metalCreditGrams || 0), 0) || 0;
          acc.totalGastoMaterial += order.rawMaterialsUsed?.reduce((sum, rm) => {
            const cost = rm.goldEquivalentCost || 0;
            return sum + cost;
          }, 0) || 0;
          acc.totalComissao += order.commissionAmount || 0;
          acc.totalARecuperar += order.residuoGramas || 0;
          return acc;
        },
        { totalRecuperado: 0, totalPagoCliente: 0, totalGastoMaterial: 0, totalComissao: 0, totalARecuperar: 0, lucro: 0 }
      );

      aggregatedData.lucro = aggregatedData.totalRecuperado - aggregatedData.totalPagoCliente - aggregatedData.totalGastoMaterial;

      setReportData(aggregatedData);
    } catch (error) {
      toast.error("Erro ao gerar o relatório.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Recuperação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-center mb-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </div>

        {reportData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Recuperado (g)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalRecuperado.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Pago a Clientes (g)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalPagoCliente.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gasto com Materiais (g)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalGastoMaterial.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Comissões (R$)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reportData.totalComissao)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">A Recuperar (Resíduo) (g)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalARecuperar.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="col-span-2 md:col-span-1 bg-green-200 border border-green-400 text-green-800 dark:text-green-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lucro (g)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.lucro.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
