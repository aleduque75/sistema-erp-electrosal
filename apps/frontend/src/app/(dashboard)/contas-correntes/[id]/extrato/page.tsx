"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { subDays, format } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { ArrowLeft, PlusCircle } from "lucide-react"; // ✅ Importar ícones
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // ✅ Importar Dialog
import { TransacaoForm } from "../../transacao-form"; // ✅ Importar o formulário

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDateTime = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleString("pt-BR", { timeZone: "UTC" })
    : "N/A";

export default function ExtratoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [extrato, setExtrato] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // ✅ Estado para controlar o modal de novo lançamento
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);

  const fetchExtrato = async () => {
    setIsFetching(true);
    try {
      const queryParams = new URLSearchParams({ startDate, endDate });
      const response = await api.get(
        `/contas-correntes/${id}/extrato?${queryParams.toString()}`
      );
      setExtrato({
        ...response.data,
        saldoAnterior: parseFloat(response.data.saldoAnterior),
        saldoFinal: parseFloat(response.data.saldoFinal),
        contaCorrente: {
          ...response.data.contaCorrente,
          saldo: parseFloat(response.data.contaCorrente.saldo),
        },
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

  useEffect(() => {
    if (id) {
      fetchExtrato();
    }
  }, [id, startDate, endDate]);

  // ✅ Função para ser chamada quando um novo lançamento é salvo
  const handleSaveLancamento = () => {
    setIsLancamentoModalOpen(false); // Fecha o modal
    fetchExtrato(); // Atualiza os dados do extrato
  };

  if (isFetching && !extrato) {
    // Mostra o carregando inicial
    return <p className="text-center p-10">Buscando extrato...</p>;
  }

  return (
    <>
      <Card className="my-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Extrato da Conta</CardTitle>
              <p className="text-muted-foreground">
                {extrato?.contaCorrente.nome} -{" "}
                {extrato?.contaCorrente.numeroConta}
              </p>
            </div>
            {/* ✅ Botões de Ação no Cabeçalho */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={() => setIsLancamentoModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Lançamento
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 my-4 p-4 border rounded-lg items-end">
            <div className="flex-1 w-full">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
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
            <p className="text-center p-4">Atualizando...</p>
          ) : extrato ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left p-4 bg-muted/50 rounded-md mb-4">
                <div>
                  <strong>Saldo Anterior:</strong>
                  <p className="font-semibold text-lg">
                    {formatCurrency(extrato.saldoAnterior)}
                  </p>
                </div>
                <div>
                  <strong>Saldo Atual (na conta):</strong>
                  <p className="font-bold text-2xl text-blue-600">
                    {formatCurrency(extrato.contaCorrente.saldo)}
                  </p>
                </div>
                <div>
                  <strong>Saldo Final do Período:</strong>
                  <p className="font-semibold text-lg">
                    {formatCurrency(extrato.saldoFinal)}
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
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
                        Nenhuma transação no período selecionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center p-10">
              Não foi possível carregar os dados do extrato.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ✅ Modal para o Novo Lançamento */}
      <Dialog
        open={isLancamentoModalOpen}
        onOpenChange={setIsLancamentoModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Novo Lançamento em {extrato?.contaCorrente.nome}
            </DialogTitle>
          </DialogHeader>
          <TransacaoForm contaCorrenteId={id} onSave={handleSaveLancamento} />
        </DialogContent>
      </Dialog>
    </>
  );
}
