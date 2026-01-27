"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AccountsPayableReport,
  getAccountsPayableReport,
  getAccountsPayableReportPdf,
} from "@/services/reportsApi";
import { getPessoas } from "@/services/pessoasApi";
import { Pessoa } from "@/types/pessoa";
import { toast } from "sonner";
import { format } from "date-fns";
import { Combobox } from "@/components/ui/combobox";

export default function AccountsPayableReportPage() {
  const [suppliers, setSuppliers] = useState<Pessoa[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<AccountsPayableReport | null>(
    null
  );
  const [loading, setIsPageLoading] = useState(false);

  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getPessoas("FORNECEDOR");
        setSuppliers(data);
      } catch (error) {
        toast.error("Erro ao buscar fornecedores.");
      }
    };
    fetchSuppliers();
  }, []);

  const handleGenerateReport = async () => {
    setIsPageLoading(true);
    setReportData(null);
    try {
      const params = {
        supplierId: selectedSupplier,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const data = await getAccountsPayableReport(params);
      setReportData(data);
      if (data.entries.length === 0) {
        toast.info("Nenhum dado encontrado para os filtros selecionados.");
      }
    } catch (error) {
      toast.error("Erro ao gerar relatório.");
    } finally {
      setIsPageLoading(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const params = {
        supplierId: selectedSupplier,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const pdfBlob = await getAccountsPayableReportPdf(params);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "relatorio_contas_a_pagar.pdf");
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
      toast.success("Download do PDF iniciado.");
    } catch (error) {
      toast.error("Erro ao gerar PDF do relatório.");
    } finally {
      setIsPrinting(false);
    }
  };

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold">Relatório de Contas a Pagar</h1>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label>Fornecedor</Label>
              <Combobox
                options={supplierOptions}
                value={selectedSupplier}
                onChange={setSelectedSupplier}
                placeholder="Selecione um fornecedor"
                searchPlaceholder="Buscar fornecedor..."
                noResultsText="Nenhum fornecedor encontrado."
              />
            </div>
            <div className="grid gap-2">
              <Label>Data Inicial</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Data Final</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Gerando..." : "Gerar Relatório"}
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="w-full"
                disabled={isPrinting}
              >
                {isPrinting ? "Imprimindo..." : "Imprimir"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.supplierName}</TableCell>
                    <TableCell>
                      {format(new Date(entry.dueDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">
                      {entry.billedAmount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.paidAmount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.balance.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">
                    Totais
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {reportData.summary.totalBilled.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {reportData.summary.totalPaid.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {reportData.summary.finalBalance.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}