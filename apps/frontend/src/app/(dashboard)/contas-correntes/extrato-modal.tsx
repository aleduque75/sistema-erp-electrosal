"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subDays, format } from "date-fns";

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDateTime = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleString("pt-BR", { timeZone: "UTC" })
    : "N/A";

export function ExtratoModal({ conta, open, onOpenChange }) {
  const [extrato, setExtrato] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  // Define o período padrão para os últimos 30 dias
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (open && conta?.id) {
      fetchExtrato();
    }
  }, [open, conta?.id, startDate, endDate]); // Refaz a busca se as datas mudarem

  const fetchExtrato = async () => {
    setIsFetching(true);
    try {
      const queryParams = new URLSearchParams({ startDate, endDate });
      const response = await api.get(
        `/contas-correntes/${conta.id}/extrato?${queryParams.toString()}`
      );
      setExtrato({
        ...response.data,
        saldoAnterior: parseFloat(response.data.saldoAnterior),
        saldoFinal: parseFloat(response.data.saldoFinal),
        transacoes: response.data.transacoes.map((t: any) => ({
          ...t,
          valor: parseFloat(t.valor),
        })),
      });
    } catch (err) {
      toast.error("Falha ao carregar extrato.");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Extrato da Conta: {conta?.nome}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-4 my-4 p-4 border rounded-lg">
          <div className="flex-1">
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {isFetching ? (
          <p className="text-center p-8">Buscando extrato...</p>
        ) : extrato ? (
          <div>
            <div className="flex justify-between p-4 bg-muted/50 rounded-md mb-4">
              <div>
                <strong>Saldo Anterior:</strong>{" "}
                {formatCurrency(extrato.saldoAnterior)}
              </div>
              <div>
                <strong>Saldo Final:</strong>{" "}
                {formatCurrency(extrato.saldoFinal)}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extrato.transacoes.length > 0 ? (
                  extrato.transacoes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDateTime(t.dataHora)}</TableCell>
                      <TableCell>{t.descricao}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${t.tipo === "CREDITO" ? "text-green-600" : "text-red-600"}`}
                      >
                        {t.tipo === "DEBITO" && "- "}
                        {formatCurrency(t.valor)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      Nenhuma transação no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center p-8">Não foi possível carregar os dados.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
