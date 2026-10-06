'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Decimal from 'decimal.js';
import { useForm, Controller } from 'react-hook-form';
import { RotateCcw, User, MapPin, Calendar, CreditCard, Trash2, AlertTriangle } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Sale } from '@/types/sale';
import { InstallmentList } from '@/components/sales/InstallmentList';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatGrams = (value: number | null | undefined) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value || 0);
const formatDecimal = (value: number | null | undefined) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const getMetalLabel = (name: string = '') => {
  const n = name.toUpperCase();
  if (n.includes('AG')) return 'Ag';
  if (n.includes('RH')) return 'Rh';
  return 'Au'; // Default to Au for Sal products or others
};

const isSalProduct = (name: string = '') => name.toUpperCase().includes('SAL');

interface SaleDetailsModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function SaleDetailsModal({ sale: initialSale, open, onOpenChange, onSave }: SaleDetailsModalProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setIsPageLoading] = useState(true);
  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);

  useEffect(() => {
    if (open && initialSale) {
      setIsPageLoading(true);
      api.get(`/sales/${initialSale.id}`)
        .then(res => setSale(res.data))
        .catch(() => toast.error("Falha ao carregar dados detalhados da venda."))
        .finally(() => setIsPageLoading(false));
    }
  }, [open, initialSale]);

  const handleRecalculate = async () => {
    if (!sale) return;
    setIsPageLoading(true);
    try {
      await api.post(`/sales/${sale.id}/recalculate-adjustment`);
      toast.success("Lucro e ajustes recalculados com sucesso!");
      // Refetch sale data
      const res = await api.get(`/sales/${sale.id}`);
      setSale(res.data);
      if (onSave) onSave();
    } catch (err) {
      toast.error("Falha ao recalcular ajuste.");
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleReopenSale = async () => {
    if (!sale) return;
    setIsPageLoading(true);
    try {
      const primaryRec = sale.accountsRec?.[0];
      if (primaryRec?.id) {
        await api.post(`/accounts-rec/${primaryRec.id}/reopen`);
      }
      toast.success("Venda reaberta e retornada para A Receber!");
      const res = await api.get(`/sales/${sale.id}`);
      setSale(res.data);
      if (onSave) onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao reabrir venda.");
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete || !sale) return;
    setIsDeletingTransaction(true);
    try {
      if (transactionToDelete.accountRecId) {
        try {
          await api.delete(
            `/accounts-rec/${transactionToDelete.accountRecId}/payments/${transactionToDelete.id}`
          );
        } catch (err: any) {
          // Fallback para exclusão direta da transação
          await api.delete(`/transacoes/${transactionToDelete.id}`);
        }
      } else {
        await api.delete(`/transacoes/${transactionToDelete.id}`);
      }

      // Dispara o recálculo dos ajustes da venda para garantir atualização completa
      try {
        await api.post(`/sales/${sale.id}/recalculate-adjustment`);
      } catch (recErr) {
        console.warn("Recalculate adjustment failed:", recErr);
      }

      toast.success("Lançamento excluído com sucesso e venda recalculada!");
      setTransactionToDelete(null);

      // Recarrega os dados da venda atualizada no modal
      const res = await api.get(`/sales/${sale.id}`);
      setSale(res.data);
      if (onSave) onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir lançamento.");
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const getPaymentInfo = () => {
    if (!sale) return 'N/A';

    const receivedAccounts = sale.accountsRec?.filter(ar => ar.received) || [];

    if (receivedAccounts.length > 0) {
      const accountNames = receivedAccounts
        .map(ar => {
          const txs = (ar as any).transacoes || (ar as any).transacao || [];
          const txList = Array.isArray(txs) ? txs : [txs];
          const firstTxName = txList[0]?.contaCorrente?.nome || txList[0]?.contaContabil?.nome;
          return firstTxName || ar.contaCorrente?.nome;
        })
        .filter(Boolean)
        .join(', ');
      return `Recebido em: ${accountNames || 'N/A'}`;
    }

    if (!sale.installments || sale.installments.length === 0) {
      if (sale.status === 'FINALIZADO') return 'Finalizado';
      return sale.paymentMethod?.replace('_', ' ') || 'Pendente';
    }

    const totalInstallments = sale.installments.length;
    const paidInstallments = sale.installments.filter(
      (inst) => inst.status === 'PAID' || inst.paidAt,
    ).length;

    if (paidInstallments === totalInstallments) {
      return 'Finalizado';
    }
    if (paidInstallments > 0) {
      return 'Parcialmente Pago';
    }
    return 'A Receber';
  };

  const uniqueTransactions = useMemo(() => {
    if (!sale) return [];

    const uniqueMap = new Map();

    // Aggregates transactions from direct receivables and installments
    const sources = [
      ...(sale.accountsRec || []),
      ...(sale.installments?.map(i => (i as any).accountRec) || [])
    ].filter(Boolean);

    sources.forEach(ar => {
      const txsRaw = (ar as any).transacoes || (ar as any).transacao || [];
      const txList = Array.isArray(txsRaw) ? txsRaw : [txsRaw];
      
      if (txList.length > 0) {
        txList.forEach(t => {
          if (t && t.id && !uniqueMap.has(t.id)) {
            uniqueMap.set(t.id, {
              ...t,
              accountRecId: t.accountRecId || ar.id,
              // Fallback for account name if missing from transaction
              displayAccount: t.contaCorrente?.nome || t.contaContabil?.nome || ar.contaCorrente?.nome || 'N/A',
              descricao: t.descricao || ar.description || 'Recebimento de Venda',
              tipo: t.tipo || 'CREDITO'
            });
          }
        });
      } else if (ar.received && (Number(ar.goldAmountPaid || 0) > 0 || Number(ar.amountPaid || 0) > 0)) {
        // Fallback: If received but no linked transactions, show a virtual one
        const virtualId = `virtual-${ar.id}`;
        if (!uniqueMap.has(virtualId)) {
          uniqueMap.set(virtualId, {
            id: virtualId,
            accountRecId: ar.id,
            tipo: 'CREDITO',
            dataHora: ar.receivedAt || ar.dueDate,
            valor: ar.amountPaid || ar.amount,
            goldAmount: ar.goldAmountPaid || ar.goldAmount,
            displayAccount: ar.contaCorrente?.nome || (Number(ar.goldAmountPaid || 0) > 0 ? 'Crédito de Metal' : 'Recebimento Direto'),
            descricao: ar.description || 'Recebimento Direto',
            isVirtual: true
          });
        }
      }
    });

    return Array.from(uniqueMap.values());
  }, [sale]);

  const totals = useMemo(() => {
    let netBRL = 0;
    let netGold = 0;

    uniqueTransactions.forEach((t) => {
      const isDebit = t.tipo === 'DEBITO';
      const val = Math.abs(Number(t.valor)) || 0;
      const gold = Math.abs(Number(t.goldAmount)) || 0;

      if (isDebit) {
        netBRL -= val;
        netGold -= gold;
      } else {
        netBRL += val;
        netGold += gold;
      }
    });

    return { netBRL, netGold };
  }, [uniqueTransactions]);

  const expectedAmount = Number(sale?.netAmount || sale?.totalAmount || 0);
  const isOverpaid = expectedAmount > 0 && totals.netBRL > expectedAmount + 50;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[94vw] md:w-[90vw] max-w-5xl lg:max-w-6xl max-h-[92vh] h-[92vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden border border-border/80 shadow-2xl rounded-2xl bg-background">
        <DialogHeader className="px-4 py-3 md:px-6 md:py-4 border-b border-border/60 bg-muted/20 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <DialogTitle className="text-base md:text-xl font-bold tracking-tight">
              Detalhes da Venda #{sale?.orderNumber}
            </DialogTitle>
            {sale && (
              <Badge
                variant={sale.status === 'FINALIZADO' ? 'default' : 'secondary'}
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  sale.status === 'FINALIZADO'
                    ? 'bg-green-600/15 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {sale.status === 'FINALIZADO' ? 'Finalizada' : sale.status}
              </Badge>
            )}
            {sale?.pessoa?.name && (
              <span className="text-xs md:text-sm text-muted-foreground font-medium hidden sm:inline">
                • {sale.pessoa.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pr-7 sm:pr-8">
            {(sale?.status === 'FINALIZADO' || (sale?.accountsRec && sale.accountsRec.some((ar: any) => ar.received))) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReopenSale}
                disabled={loading}
                className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 font-medium h-8 px-2.5 text-xs shadow-sm"
                title="Reabrir venda e retornar título para A Receber"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Voltar para </span>A Receber
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={loading}
              className="h-8 px-2.5 text-xs font-medium shadow-sm hover:bg-accent"
              title="Recalcular lucro e custos com base nas cotações e transações"
            >
              <RotateCcw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Recalcular
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center text-muted-foreground animate-pulse text-sm">
            Carregando dados detalhados da venda...
          </div>
        ) : sale ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 space-y-4 md:space-y-6 overscroll-contain">
              {/* DESTAQUE DO LUCRO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Lucro Líquido (R$)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div
                      className={`text-2xl md:text-3xl font-bold ${
                        Number(sale.adjustment?.netProfitBRL || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(Number(sale.adjustment?.netProfitBRL || 0))}
                    </div>
                    {/* Detalhamento do Lucro */}
                    {sale.adjustment && (
                      <div className="mt-4 pt-4 border-t border-primary/10 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Lucro Bruto:</span>
                          <span className="font-semibold text-foreground font-mono">
                            {formatCurrency(Number(sale.adjustment.grossProfitBRL || 0))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Frete/Outros Custos:</span>
                          <span className="font-medium text-red-500 font-mono">
                            -{formatCurrency(Number(sale.adjustment.otherCostsBRL || 0))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold text-blue-600 dark:text-blue-400">Comissão:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                            -{formatCurrency(Number(sale.adjustment.commissionBRL || 0))}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Lucro em Metal (AU)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div
                      className={`text-2xl md:text-3xl font-bold ${
                        Number(sale.adjustment?.netDiscrepancyGrams || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatGrams(Number(sale.adjustment?.netDiscrepancyGrams || 0))} g
                    </div>
                    {/* Detalhamento do Lucro em Ouro */}
                    {sale.adjustment && (
                      <div className="mt-4 pt-4 border-t border-primary/10 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Diferença Bruta (Au):</span>
                          <span className="font-semibold text-foreground font-mono">
                            {formatGrams(Number(sale.adjustment.grossDiscrepancyGrams || 0))} g
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Custos (Au):</span>
                          <span className="font-medium text-red-500 font-mono">
                            -{formatGrams(Number(sale.adjustment.costsInGrams || 0))} g
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Mão de Obra (Au):</span>
                          <span className="font-semibold text-foreground font-mono">
                            {formatGrams(Number(sale.adjustment.laborCostGrams || 0))} g
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-primary/5 pt-1.5 mt-1">
                          <span className="text-muted-foreground font-medium">Custo Histórico Lotes (Au):</span>
                          <span className="font-medium text-red-500 font-mono">
                            {formatGrams(Number(sale.adjustment.totalCostGrams || 0))} g
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes do Cliente e Venda em Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card do Cliente */}
                <Card className="border border-border/80 shadow-sm">
                  <CardHeader className="pb-3 px-4 pt-4">
                    <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <User className="h-4 w-4" />
                      Dados do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4">
                    <div>
                      <p className="font-bold text-base md:text-lg text-foreground">{sale.pessoa.name}</p>
                    </div>
                    <div className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="leading-relaxed">
                        <p>{`${sale.pessoa.logradouro || ''}, ${sale.pessoa.numero || ''}`}</p>
                        <p>{`${sale.pessoa.bairro || ''} - ${sale.pessoa.cidade || ''}/${sale.pessoa.uf || ''}`}</p>
                        <p>{`CEP: ${sale.pessoa.cep || ''}`}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card da Venda */}
                <Card className="border border-border/80 shadow-sm">
                  <CardHeader className="pb-3 px-4 pt-4">
                    <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <Calendar className="h-4 w-4" />
                      Resumo da Venda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 px-4 pb-4 text-xs md:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Data da Venda:</span>
                      <span className="font-semibold text-foreground">
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-muted-foreground shrink-0">Status Pagamento:</span>
                      <span className="font-bold text-foreground text-right truncate">
                        {getPaymentInfo()}
                      </span>
                    </div>

                    {sale.adjustment && (
                      <div className="pt-2.5 mt-2 border-t border-border/50 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Cotação Pagamento:</span>
                          <span className="font-mono font-medium text-foreground">
                            {formatCurrency(Number(sale.adjustment.paymentQuotation || 0))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Equivalente em Ouro:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatGrams(sale.adjustment.paymentEquivalentGrams)} g
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Variação Cotação:</span>
                          <span
                            className={`font-mono font-bold ${
                              Number(sale.adjustment.grossDiscrepancyGrams || 0) > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatDecimal(
                              (Number(sale.adjustment.grossDiscrepancyGrams || 0) /
                                (sale.adjustment.saleExpectedGrams || 1)) *
                                100,
                            )}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes dos Pagamentos */}
              <Card className="border border-border/80 shadow-sm overflow-hidden">
                <CardHeader className="p-3 sm:p-4 md:p-5 pb-2 md:pb-3 flex flex-row items-center justify-between gap-2 border-b border-border/40 bg-muted/10">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-bold uppercase tracking-wider text-foreground">
                      Detalhes dos Pagamentos
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Revise os lançamentos e exclua pagamentos duplicados ou incorretos.
                    </p>
                  </div>
                  {uniqueTransactions.length > 0 && (
                    <Badge variant="outline" className="text-xs font-mono shrink-0">
                      {uniqueTransactions.length} {uniqueTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-0 sm:p-4 md:p-5">
                  {isOverpaid && (
                    <div className="m-3 sm:m-0 sm:mb-4 p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="font-bold">Aviso de Recebimento Excessivo: </span>
                        O total líquido recebido ({formatCurrency(totals.netBRL)}) é superior ao valor do pedido ({formatCurrency(expectedAmount)}). 
                        Caso haja lançamentos duplicados gerados após cancelamentos ou re-lançamentos, utilize o botão de lixeira na coluna de Ações abaixo para excluir o lançamento excedente.
                      </div>
                    </div>
                  )}

                  {/* Desktop / Tablet Table */}
                  <div className="hidden sm:block overflow-x-auto rounded-lg border border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-[95px] text-xs">Data</TableHead>
                          <TableHead className="w-[110px] text-xs">Tipo</TableHead>
                          <TableHead className="min-w-[180px] text-xs">Descrição / Origem</TableHead>
                          <TableHead className="min-w-[130px] text-xs">Conta Corrente</TableHead>
                          <TableHead className="text-right whitespace-nowrap text-xs">Valor (BRL)</TableHead>
                          <TableHead className="text-right whitespace-nowrap text-xs">Valor (Au)</TableHead>
                          <TableHead className="w-[50px] text-center text-xs">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uniqueTransactions.map((transacao) => {
                          const isDebit = transacao.tipo === 'DEBITO';
                          return (
                            <TableRow key={transacao.id} className={isDebit ? "bg-red-50/20 dark:bg-red-950/10" : ""}>
                              <TableCell className="whitespace-nowrap text-xs font-medium">
                                {formatDate(transacao.dataHora)}
                              </TableCell>
                              <TableCell>
                                {isDebit ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">
                                    Estorno
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-900">
                                    Recebimento
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-medium max-w-[240px] truncate" title={transacao.descricao || 'Recebimento de Venda'}>
                                {transacao.descricao || 'Recebimento de Venda'}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-foreground">{transacao.displayAccount || 'N/A'}</TableCell>
                              <TableCell className={`text-right text-xs font-bold font-mono whitespace-nowrap ${isDebit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {isDebit ? '-' : '+'} {formatCurrency(Math.abs(Number(transacao.valor)))}
                              </TableCell>
                              <TableCell className={`text-right text-xs font-bold font-mono whitespace-nowrap ${isDebit ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {isDebit ? '-' : '+'} {formatGrams(Math.abs(Number(transacao.goldAmount)))} g
                              </TableCell>
                              <TableCell className="text-center">
                                {!transacao.isVirtual ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title="Excluir este lançamento"
                                    onClick={() => setTransactionToDelete(transacao)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Rodapé com Totais Líquidos */}
                    {uniqueTransactions.length > 0 && (
                      <div className="flex justify-between items-center px-4 py-3 bg-muted/40 border-t text-xs">
                        <span className="font-bold text-muted-foreground uppercase tracking-wider">
                          Total Líquido Recebido:
                        </span>
                        <div className="flex items-center gap-3 font-mono font-bold">
                          <span className="text-foreground text-sm">{formatCurrency(totals.netBRL)}</span>
                          <span className="text-muted-foreground font-normal">|</span>
                          <span className="text-amber-600 dark:text-amber-400 text-sm">{formatGrams(totals.netGold)} g Au</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile View Cards */}
                  <div className="sm:hidden space-y-2.5 p-3">
                    {uniqueTransactions.map((transacao) => {
                      const isDebit = transacao.tipo === 'DEBITO';
                      return (
                        <div
                          key={transacao.id}
                          className={`p-3 rounded-xl border text-xs space-y-2 ${
                            isDebit
                              ? "bg-red-50/20 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                              : "bg-card border-border/80 shadow-sm"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                {formatDate(transacao.dataHora)}
                              </span>
                              {isDebit ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                  Estorno
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300">
                                  Recebimento
                                </span>
                              )}
                            </div>
                            {!transacao.isVirtual && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Excluir este lançamento"
                                onClick={() => setTransactionToDelete(transacao)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-foreground line-clamp-1">{transacao.descricao || 'Recebimento'}</p>
                            <p className="text-[11px] text-muted-foreground">{transacao.displayAccount}</p>
                          </div>

                          <div className="flex justify-between items-baseline border-t pt-2 mt-1 border-border/40 font-mono">
                            <span className={`text-sm font-black tabular-nums ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                              {isDebit ? '-' : '+'} {formatCurrency(Math.abs(Number(transacao.valor)))}
                            </span>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                              {isDebit ? '-' : '+'} {formatGrams(Math.abs(Number(transacao.goldAmount)))} g
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {uniqueTransactions.length > 0 && (
                      <div className="p-3 bg-muted/40 rounded-xl border flex justify-between items-center text-xs">
                        <span className="font-bold uppercase text-[10px] text-muted-foreground">Total Líquido:</span>
                        <div className="text-right font-mono">
                          <p className="font-black text-foreground text-sm">{formatCurrency(totals.netBRL)}</p>
                          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{formatGrams(totals.netGold)} g Au</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {uniqueTransactions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic text-xs">Nenhum pagamento registrado.</div>
                  )}
                </CardContent>
              </Card>

              {/* Itens da Venda */}
              <Card className="border border-border/80 shadow-sm overflow-hidden">
                <CardHeader className="p-3 sm:p-4 md:p-5 pb-2 md:pb-3 border-b border-border/40 bg-muted/10">
                  <CardTitle className="text-xs md:text-sm font-bold uppercase tracking-wider text-foreground">
                    Itens da Venda
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-4 md:p-5">
                  <div className="hidden sm:block overflow-x-auto rounded-lg border border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Produto</TableHead>
                          <TableHead className="text-xs">Lote</TableHead>
                          <TableHead className="text-center text-xs">Qtd.</TableHead>
                          <TableHead className="text-right text-xs">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sale.saleItems?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-xs text-foreground">{item.product.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.saleItemLots && item.saleItemLots.length > 0
                                ? item.saleItemLots.map((sl: any) => sl.inventoryLot?.batchNumber).filter(Boolean).join(', ')
                                : item.inventoryLotId || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              <span className="font-semibold text-foreground">{item.quantity}</span>
                              {isSalProduct(item.product?.name) && item.product?.goldValue ? item.product.goldValue > 0 && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                  ({formatGrams(item.quantity * item.product.goldValue)} {getMetalLabel(item.product?.name)})
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right font-bold font-mono text-xs text-foreground">
                              {formatCurrency(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Items List */}
                  <div className="sm:hidden divide-y divide-border/60 p-2">
                    {sale.saleItems?.map((item) => (
                      <div key={item.id} className="p-3 flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-sm text-foreground leading-snug">
                            {item.product.name}
                          </span>
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground uppercase shrink-0">
                            LT: {item.saleItemLots && item.saleItemLots.length > 0
                              ? item.saleItemLots.map((sl: any) => sl.inventoryLot?.batchNumber).filter(Boolean).join(', ')
                              : item.inventoryLotId || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">
                            Qtd: <strong className="text-foreground">{item.quantity}</strong>
                            {isSalProduct(item.product?.name) && item.product?.goldValue ? item.product.goldValue > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-bold ml-1">
                                ({formatGrams(item.quantity * item.product.goldValue)} {getMetalLabel(item.product?.name)})
                              </span>
                            ) : null}
                          </span>
                          <span className="font-bold font-mono text-foreground text-sm">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              {/* @ts-ignore */}
              {sale.observation && (
                <Card className="border border-border/80 shadow-sm overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 md:p-5 pb-2 border-b border-border/40 bg-muted/10">
                    <CardTitle className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-5">
                    {/* @ts-ignore */}
                    <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap">{sale.observation}</p>
                  </CardContent>
                </Card>
              )}

              {/* Installments List */}
              {sale.installments && sale.installments.length > 0 && (
                <InstallmentList
                  installments={sale.installments}
                  saleId={sale.id}
                  onInstallmentPaid={() => {
                    api.get(`/sales/${sale.id}`).then(res => setSale(res.data));
                  }}
                />
              )}
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 px-4 py-3 md:px-6 md:py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Venda #{sale.orderNumber}</span>
                <span>•</span>
                <span className="font-mono font-medium text-foreground">Total: {formatCurrency(expectedAmount)}</span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 px-4 text-xs font-medium">
                Fechar
              </Button>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground text-sm">Não foi possível carregar os detalhes da venda.</div>
        )}

        {/* Diálogo de confirmação para exclusão de lançamento de pagamento */}
        <AlertDialog
          open={!!transactionToDelete}
          onOpenChange={(open) => !open && setTransactionToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Lançamento de Pagamento</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-2">
                <span className="block text-sm">
                  Tem certeza que deseja excluir o lançamento{" "}
                  <strong className="text-foreground">
                    {transactionToDelete?.descricao || "Recebimento"}
                  </strong>{" "}
                  no valor de{" "}
                  <strong className="text-foreground font-mono">
                    {formatCurrency(Math.abs(Number(transactionToDelete?.valor)))}
                  </strong>
                  {transactionToDelete?.goldAmount ? ` (${formatGrams(Math.abs(Number(transactionToDelete.goldAmount)))} g Au)` : ""}?
                </span>
                {transactionToDelete?.displayAccount && (
                  <span className="block text-xs text-muted-foreground">
                    Conta Corrente afetada: <strong>{transactionToDelete.displayAccount}</strong>
                  </span>
                )}
                <span className="block text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                  Esta ação removerá a movimentação financeira do extrato da conta corrente e recalculará automaticamente o lucro, equivalente em ouro e status desta venda.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingTransaction}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTransaction}
                disabled={isDeletingTransaction}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingTransaction ? "Excluindo..." : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}