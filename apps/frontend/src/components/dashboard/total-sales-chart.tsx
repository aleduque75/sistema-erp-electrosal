"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { startOfYear, endOfYear, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, parse, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Data structures
interface PeriodData {
  period: string;
  totalSalesGold: number;
  totalExpensesGold: number;
  totalProfitGold: number;
}
interface FinancialSummary {
  monthly: PeriodData[];
  quarterly: PeriodData[];
  semiannual: PeriodData[];
}
interface SaleDetail {
  orderNumber: number;
  createdAt: string;
  goldValue: number;
  profitGold: number;
}
interface ExpenseDetail {
  descricao: string;
  dataHora: string;
  goldAmount: number;
}
interface PeriodDetails {
  sales: SaleDetail[];
  expenses: ExpenseDetail[];
}

export function TotalSalesChart() {
  // Component State
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setIsPageLoading] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showProfit, setShowProfit] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [selectedPeriodDetails, setSelectedPeriodDetails] = useState<PeriodDetails | null>(null);
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<{ startDate: Date, endDate: Date } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchFinancialSummary = async () => {
      setIsPageLoading(true);
      try {
        const response = await api.get("/dashboard/financial-summary-by-period");
        const summary: FinancialSummary = response.data;
        setData(summary);

        const years = new Set<string>();
        summary.monthly.forEach(item => {
            const year = item.period.split('/')[1];
            if(year) years.add(`20${year}`);
        });
        const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
        setAvailableYears(sortedYears);
        if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[0]);
        }
      } catch (error) {
        toast.error("Falha ao carregar o resumo financeiro por período.");
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchFinancialSummary();
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (selectedYear === 'ALL') return data;
    const filterByYear = (periodData: PeriodData[]) => periodData.filter(item => item.period.includes(selectedYear.slice(-2)));
    return {
        monthly: filterByYear(data.monthly),
        quarterly: filterByYear(data.quarterly),
        semiannual: filterByYear(data.semiannual),
    }
  }, [data, selectedYear]);

  const handleBarClick = async (data: any, periodType: 'monthly' | 'quarterly' | 'semiannual') => {
    if (!data || !data.activeLabel) return;
    
    const periodLabel = data.activeLabel;
    setSelectedPeriodLabel(periodLabel);
    setIsDetailsLoading(true);
    setDialogOpen(true);
    setSelectedPeriod(null);

    try {
        let startDate, endDate;
        const yearStr = periodLabel.match(/(\d{4}|\d{2})$/)?.[0];
        const year = yearStr && yearStr.length === 2 ? parseInt(`20${yearStr}`) : parseInt(yearStr);

        if (periodType === 'monthly') {
            const monthDate = parse(periodLabel, 'MMM/yy', new Date(), { locale: ptBR });
            startDate = startOfMonth(monthDate);
            endDate = endOfMonth(monthDate);
        } else if (periodType === 'quarterly') {
            const quarter = parseInt(periodLabel.match(/T(\d)/)?.[1] || '1');
            startDate = startOfQuarter(new Date(year, (quarter - 1) * 3));
            endDate = endOfQuarter(new Date(year, (quarter - 1) * 3));
        } else {
            const semester = parseInt(periodLabel.match(/S(\d)/)?.[1] || '1');
            startDate = semester === 1 ? startOfYear(new Date(year, 0, 1)) : new Date(year, 6, 1);
            endDate = semester === 1 ? new Date(year, 5, 30, 23, 59, 59) : endOfYear(new Date(year, 0, 1));
        }
        
        setSelectedPeriod({ startDate, endDate });
        const response = await api.get('/dashboard/transactions-by-period', { params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() } });
        setSelectedPeriodDetails(response.data);
    } catch (error) {
        toast.error("Falha ao carregar os detalhes do período.");
        setDialogOpen(false);
    } finally {
        setIsDetailsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedPeriod) {
        toast.error("Período não selecionado para gerar o PDF.");
        return;
    }
    setIsDownloadingPdf(true);
    try {
        const { startDate, endDate } = selectedPeriod;
        const response = await api.get('/dashboard/financial-summary-pdf', {
            params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = `resumo_financeiro_${format(startDate, 'yyyy-MM-dd')}_a_${format(endDate, 'yyyy-MM-dd')}.pdf`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
        toast.success("Download do PDF iniciado.");
    } catch (error) {
        console.error("Falha ao baixar o PDF:", error);
        toast.error("Falha ao baixar o PDF. Tente novamente.");
    } finally {
        setIsDownloadingPdf(false);
    }
  };

  const renderChart = (chartData: PeriodData[], periodType: 'monthly' | 'quarterly' | 'semiannual') => (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} onClick={(data) => handleBarClick(data, periodType)} style={{cursor: 'pointer'}}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis tickFormatter={(value) => `${Number(value).toFixed(2)}g`} />
        <Tooltip content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-background border p-2 rounded-md shadow-md">
                <p className="label font-bold">{`${label}`}</p>
                {payload.map((p, i) => <p key={i} style={{ color: p.fill }}>{`${p.name}: ${Number(p.value).toFixed(4)}g`}</p>)}
              </div>
            );
          }
          return null;
        }} />
        <Legend />
        {showSales && <Bar dataKey="totalSalesGold" name="Vendas (Au)" fill="#FFD700" />}
        {showExpenses && <Bar dataKey="totalExpensesGold" name="Despesas (Au)" fill="#dc2626" />}
        {showProfit && <Bar dataKey="totalProfitGold" name="Lucro (Au)" fill="#22c55e" />}
      </BarChart>
    </ResponsiveContainer>
  );

  const salesTotal = useMemo(() => selectedPeriodDetails?.sales.reduce((sum, item) => sum + Number(item.goldValue), 0) || 0, [selectedPeriodDetails]);
  const profitTotal = useMemo(() => selectedPeriodDetails?.sales.reduce((sum, item) => sum + Number(item.profitGold), 0) || 0, [selectedPeriodDetails]);
  const expensesTotal = useMemo(() => selectedPeriodDetails?.expenses.reduce((sum, item) => sum + Number(item.goldAmount), 0) || 0, [selectedPeriodDetails]);

  if (loading) return <Card><CardHeader><CardTitle>Resumo Financeiro (Au)</CardTitle></CardHeader><CardContent className="flex items-center justify-center h-[350px]"><p>Carregando...</p></CardContent></Card>;
  if (!filteredData) return <Card><CardHeader><CardTitle>Resumo Financeiro (Au)</CardTitle></CardHeader><CardContent><p>Nenhum dado disponível.</p></CardContent></Card>;

  return (
    <>
      <Tabs defaultValue="monthly">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="space-y-1"><CardTitle>Resumo Financeiro (Au)</CardTitle><CardDescription>Vendas e despesas em ouro por período.</CardDescription></div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center space-x-2"><Checkbox id="show-sales" checked={showSales} onCheckedChange={(c) => setShowSales(Boolean(c))} /><Label htmlFor="show-sales">Vendas</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="show-expenses" checked={showExpenses} onCheckedChange={(c) => setShowExpenses(Boolean(c))} /><Label htmlFor="show-expenses">Despesas</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="show-profit" checked={showProfit} onCheckedChange={(c) => setShowProfit(Boolean(c))} /><Label htmlFor="show-profit">Lucro</Label></div>
              <Select value={selectedYear} onValueChange={setSelectedYear}><SelectTrigger className="w-auto md:w-[130px]"><SelectValue placeholder="Ano" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem>{availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select>
              <TabsList><TabsTrigger value="monthly">Mensal</TabsTrigger><TabsTrigger value="quarterly">Trimestral</TabsTrigger><TabsTrigger value="semiannual">Semestral</TabsTrigger></TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="monthly">{renderChart(filteredData.monthly, 'monthly')}</TabsContent>
            <TabsContent value="quarterly">{renderChart(filteredData.quarterly, 'quarterly')}</TabsContent>
            <TabsContent value="semiannual">{renderChart(filteredData.semiannual, 'semiannual')}</TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Período: {selectedPeriodLabel}</DialogTitle>
            <DialogDescription>Detalhes de vendas e despesas para o período selecionado.</DialogDescription>
          </DialogHeader>
          {isDetailsLoading ? <div className="flex items-center justify-center h-64"><p>Carregando detalhes...</p></div> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pt-4">
                <div>
                  <h3 className="font-semibold mb-2">Vendas</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Pedido</TableHead><TableHead className="text-right">Valor (Au)</TableHead><TableHead className="text-right">Lucro (Au)</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedPeriodDetails?.sales.map((sale, i) => <TableRow key={`sale-${i}`}><TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell><TableCell>{sale.orderNumber}</TableCell><TableCell className="text-right">{Number(sale.goldValue).toFixed(4)}g</TableCell><TableCell className="text-right">{Number(sale.profitGold).toFixed(4)}g</TableCell></TableRow>)}
                      {selectedPeriodDetails?.sales.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">Nenhuma venda neste período.</TableCell></TableRow>}
                    </TableBody>
                    <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right">{salesTotal.toFixed(4)}g</TableCell><TableCell className="text-right">{profitTotal.toFixed(4)}g</TableCell></TableRow></TableFooter>
                  </Table>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Despesas</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor (Au)</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedPeriodDetails?.expenses.map((exp, i) => <TableRow key={`exp-${i}`}><TableCell>{new Date(exp.dataHora).toLocaleDateString()}</TableCell><TableCell>{exp.descricao}</TableCell><TableCell className="text-right">{Number(exp.goldAmount).toFixed(4)}g</TableCell></TableRow>)}
                      {selectedPeriodDetails?.expenses.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">Nenhuma despesa neste período.</TableCell></TableRow>}
                    </TableBody>
                    <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right">{expensesTotal.toFixed(4)}g</TableCell></TableRow></TableFooter>
                  </Table>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
                    <Printer className="mr-2 h-4 w-4" />
                    {isDownloadingPdf ? 'Baixando...' : 'Imprimir PDF'}
                </Button>
            </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}