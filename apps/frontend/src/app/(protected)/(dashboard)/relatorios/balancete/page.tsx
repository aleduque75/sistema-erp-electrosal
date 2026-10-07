"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { addDays } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Importar Input
import { formatDate } from "@/lib/date-utils";
import { formatInTimeZone } from "date-fns-tz";

interface TransactionDetail {
  id: string;
  tipo: string;
  valor: number;
  moeda: string;
  descricao?: string;
  dataHora: string;
  goldAmount?: number;
  goldPrice?: number;
  contaContabilId: string;
  contaContabil: {
    codigo: string;
    nome: string;
  };
}

interface TrialBalanceEntry {
  contaContabilId: string;
  contaContabilCodigo: string;
  contaContabilNome: string;
  saldoInicialDebito: number;
  saldoInicialCredito: number;
  movimentoDebito: number;
  movimentoCredito: number;
  saldoFinalDebito: number;
  saldoFinalCredito: number;
  saldoInicialGold: number; // NOVO
  movimentoGold: number; // NOVO
  saldoFinalGold: number; // NOVO
  transactions?: TransactionDetail[]; // Adicionado para o relatório detalhado
}

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

export default function TrialBalancePage() {
  const { user, isLoading } = useAuth();
  const [reportData, setReportData] = useState<TrialBalanceEntry[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [startDate, setStartDate] = useState<string>(format(addDays(new Date(), -30), "yyyy-MM-dd")); // Novo estado para data inicial como string
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd")); // Novo estado para data final como string
  const [selectedContaContabilId, setSelectedContaContabilId] = useState<string | undefined>(undefined);
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [includeTransactions, setIncludeTransactions] = useState(false); // NOVO ESTADO

  const fetchContasContabeis = useCallback(async () => {
    try {
      const response = await api.get("/contas-contabeis");
      setContasContabeis(response.data);
    } catch (err) {
      toast.error("Falha ao carregar contas contábeis.");
    }
  }, []);

  useEffect(() => {
    fetchContasContabeis();
  }, [fetchContasContabeis]);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error("Selecione um período para gerar o relatório.");
      return;
    }

    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      });
      if (selectedContaContabilId) {
        params.append('contaContabilId', selectedContaContabilId);
      }
      if (includeTransactions) { // Adicionar parâmetro para incluir transações
        params.append('includeTransactions', 'true');
      }

      const response = await api.get(`/reports/trial-balance?${params.toString()}`);
      setReportData(response.data.map((item: any) => ({
        ...item,
        saldoInicialDebito: parseFloat(item.saldoInicialDebito),
        saldoInicialCredito: parseFloat(item.saldoInicialCredito),
        movimentoDebito: parseFloat(item.movimentoDebito),
        movimentoCredito: parseFloat(item.movimentoCredito),
        saldoFinalDebito: parseFloat(item.saldoFinalDebito),
        saldoFinalCredito: parseFloat(item.saldoFinalCredito),
        saldoInicialGold: parseFloat(item.saldoInicialGold || 0), // NOVO
        movimentoGold: parseFloat(item.movimentoGold || 0), // NOVO
        saldoFinalGold: parseFloat(item.saldoFinalGold || 0), // NOVO
        transactions: item.transactions?.map((t: any) => ({ // NOVO
          ...t,
          valor: parseFloat(t.valor),
          goldAmount: parseFloat(t.goldAmount || 0),
          goldPrice: parseFloat(t.goldPrice || 0),
        })),
      })));
    } catch (err) {
      toast.error("Falha ao gerar balancete de verificação.");
    } finally {
      setIsFetching(false);
    }
  }, [startDate, endDate, selectedContaContabilId, includeTransactions]); // Adicionar includeTransactions como dependência

  useEffect(() => {
    if (user && !isLoading) {
      fetchReport();
    }
  }, [user, isLoading, fetchReport]);

  const columns: ColumnDef<TrialBalanceEntry>[] = [
    {
      id: "expander", // Adicionar um ID para a coluna do expansor
      header: ({ table }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.toggleAllRowsExpanded()}
          className="h-8 w-8 p-0"
        >
          {table.getIsAllRowsExpanded() ? "👇" : "👉"}
        </Button>
      ),
      cell: ({ row }) =>
        row.original.transactions && row.original.transactions.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.toggleExpanded()}
            className="h-8 w-8 p-0"
          >
            {row.getIsExpanded() ? "👇" : "👉"}
          </Button>
        ) : null,
      enableSorting: false,
      enableHiding: false,
      meta: {
        visible: includeTransactions, // Visível apenas se includeTransactions for true
      },
    },
    {
      accessorKey: "contaContabilCodigo",
      header: "Código",
    },
    {
      accessorKey: "contaContabilNome",
      header: "Conta Contábil",
    },
    {
      accessorKey: "saldoInicialDebito",
      header: () => <div className="text-right">Saldo Inicial (Débito)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.original.saldoInicialDebito)}
        </div>
      ),
    },
    {
      accessorKey: "saldoInicialCredito",
      header: () => <div className="text-right">Saldo Inicial (Crédito)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.original.saldoInicialCredito)}
        </div>
      ),
    },
    {
      accessorKey: "movimentoDebito",
      header: () => <div className="text-right">Movimento (Débito)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.original.movimentoDebito)}
        </div>
      ),
    },
    {
      accessorKey: "movimentoCredito",
      header: () => <div className="text-right">Movimento (Crédito)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.original.movimentoCredito)}
        </div>
      ),
    },
    {
      accessorKey: "saldoFinalDebito",
      header: () => <div className="text-right">Saldo Final (Débito)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.original.saldoFinalDebito)}
        </div>
      ),
    },
    {
      accessorKey: "saldoFinalCredito",
      header: () => <div className="text-right">Saldo Final (Crédito)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.original.saldoFinalCredito)}
        </div>
      ),
    },
    {
      accessorKey: "saldoInicialGold",
      header: () => <div className="text-right">Saldo Inicial (AU)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.saldoInicialGold.toFixed(4)} g
        </div>
      ),
    },
    {
      accessorKey: "movimentoGold",
      header: () => <div className="text-right">Movimento (AU)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.movimentoGold.toFixed(4)} g
        </div>
      ),
    },
    {
      accessorKey: "saldoFinalGold",
      header: () => <div className="text-right">Saldo Final (AU)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.saldoFinalGold.toFixed(4)} g
        </div>
      ),
    },
  ];

  const transactionColumns: ColumnDef<TransactionDetail>[] = [
    {
      accessorKey: "dataHora",
      header: "Data",
      cell: ({ row }) => formatDate(row.original.dataHora),
    },
    {
      accessorKey: "descricao",
      header: "Descrição",
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
    },
    {
      accessorKey: "valor",
      header: () => <div className="text-right">Valor (BRL)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.original.valor)}
        </div>
      ),
    },
    {
      accessorKey: "moeda",
      header: "Moeda",
    },
    {
      accessorKey: "goldAmount",
      header: () => <div className="text-right">Valor (AU)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.goldAmount?.toFixed(4)} g
        </div>
      ),
    },
    {
      accessorKey: "goldPrice",
      header: () => <div className="text-right">Cotação (AU)</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.goldPrice?.toFixed(2)}
        </div>
      ),
    },
  ];

  const handleGeneratePdf = useCallback(() => {
    if (!startDate || !endDate) {
      toast.error("Selecione um período para gerar o PDF.");
      return;
    }

    const params = new URLSearchParams({
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
    if (selectedContaContabilId) {
      params.append('contaContabilId', selectedContaContabilId);
    }
    if (includeTransactions) {
      params.append('includeTransactions', 'true');
    }

    // Assuming your API is at the same origin, or you have a proxy setup
    const pdfUrl = `/reports/trial-balance/pdf?${params.toString()}`;
    window.open(pdfUrl, '_blank');
  }, [startDate, endDate, selectedContaContabilId, includeTransactions]);

  if (isLoading) return <p className="text-center p-10">Carregando...</p>;

  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold">Balancete de Verificação</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 flex gap-4">
              <div className="flex-1">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">Data Final</Label>
                <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="contaContabil">Conta Contábil (Opcional)</Label>
              <Combobox
                options={contasContabeis.map((cc) => ({
                  value: cc.id,
                  label: `${cc.codigo} - ${cc.nome}`,
                }))}
                placeholder="Selecione uma conta..."
                onChange={setSelectedContaContabilId}
                value={selectedContaContabilId}
                clearable // Permite limpar a seleção
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeTransactions"
                checked={includeTransactions}
                onChange={(e) => setIncludeTransactions(e.target.checked)}
              />
              <Label htmlFor="includeTransactions">Incluir Transações Detalhadas</Label>
            </div>
            <Button onClick={fetchReport} disabled={isFetching}>
              {isFetching ? "Gerando..." : "Gerar Relatório"}
            </Button>
            <Button onClick={handleGeneratePdf} disabled={isFetching} variant="outline">
              Gerar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados do Balancete</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={reportData}
            isLoading={isFetching}
            getRowCanExpand={(row) =>
              includeTransactions &&
              row.original.transactions &&
              row.original.transactions.length > 0
            }
            renderSubComponent={({ row }) =>
              includeTransactions && row.original.transactions ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                  <h3 className="text-lg font-semibold mb-2">Transações Detalhadas:</h3>
                  <DataTable
                    columns={transactionColumns}
                    data={row.original.transactions}
                    filterColumnId={undefined} // Não filtrar sub-tabela
                    filterPlaceholder={undefined}
                    isLoading={false}
                  />
                </div>
              ) : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
