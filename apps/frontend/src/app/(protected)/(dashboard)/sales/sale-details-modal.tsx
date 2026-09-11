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
      <DialogContent className="max-w-full sm:max-w-lg md:max-w-3xl max-h-[95vh] h-[95vh] md:h-auto overflow-y-auto p-2 md:p-6">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda #{sale?.orderNumber}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p>Carregando...</p>
        ) : sale ? (
          <>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={loading}>
                <RotateCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Recalcular Lucro/Ajuste
              </Button>
            </div>

            {/* DESTAQUE DO LUCRO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lucro Líquido (R$)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className={`text-2xl font-bold ${Number(sale.adjustment?.netProfitBRL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Number(sale.adjustment?.netProfitBRL || 0))}
                  </div>
                  {/* Detalhamento do Lucro */}
                  {sale.adjustment && (
                    <div className="mt-4 pt-4 border-t border-primary/10 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lucro Bruto:</span>
                        <span className="font-medium text-foreground">{formatCurrency(Number(sale.adjustment.grossProfitBRL || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frete/Outros Custos:</span>
                        <span className="font-medium text-red-500">-{formatCurrency(Number(sale.adjustment.otherCostsBRL || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold text-blue-600">Comissão:</span>
                        <span className="font-bold text-blue-600">-{formatCurrency(Number(sale.adjustment.commissionBRL || 0))}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lucro em Metal (AU)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className={`text-2xl font-bold ${Number(sale.adjustment?.netDiscrepancyGrams || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatGrams(Number(sale.adjustment?.netDiscrepancyGrams || 0))}
                  </div>
                  {/* Detalhamento do Lucro em Ouro */}
                  {sale.adjustment && (
                    <div className="mt-4 pt-4 border-t border-primary/10 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Diferença Bruta (Au):</span>
                        <span className="font-medium text-foreground">{formatGrams(Number(sale.adjustment.grossDiscrepancyGrams || 0))} g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Custos (Au):</span>
                        <span className="font-medium text-red-500">-{formatGrams(Number(sale.adjustment.costsInGrams || 0))} g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mão de Obra (Au):</span>
                        <span className="font-medium text-foreground">{formatGrams(Number(sale.adjustment.laborCostGrams || 0))} g</span>
                      </div>
                      <div className="flex justify-between border-t border-primary/5 pt-1 mt-1">
                        <span className="text-muted-foreground font-medium">Custo Histórico Lotes (Au):</span>
                        <span className="font-medium text-red-500">{formatGrams(Number(sale.adjustment.totalCostGrams || 0))} g</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detalhes do Cliente e Venda em Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card do Cliente */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <User className="h-4 w-4" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">{sale.pessoa.name}</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p>{`${sale.pessoa.logradouro || ''}, ${sale.pessoa.numero || ''}`}</p>
                      <p>{`${sale.pessoa.bairro || ''} - ${sale.pessoa.cidade || ''}/${sale.pessoa.uf || ''}`}</p>
                      <p>{`CEP: ${sale.pessoa.cep || ''}`}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card da Venda */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Calendar className="h-4 w-4" />
                    Resumo da Venda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">{new Date(sale.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status Pagamento:</span>
                    <span className="font-bold">{getPaymentInfo()}</span>
                  </div>

                  {sale.adjustment && (
                    <div className="pt-2 mt-2 border-t border-border/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Cotação Pagamento:</span>
                        <span>{formatCurrency(Number(sale.adjustment.paymentQuotation || 0))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Equivalente em Ouro:</span>
                        <span>{formatGrams(sale.adjustment.paymentEquivalentGrams)} g</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Variação Cotação:</span>
                        <span className={`font-bold ${Number(sale.adjustment.grossDiscrepancyGrams || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
            <Card className="border-none md:border shadow-none md:shadow-sm">
              <CardHeader className="p-2 md:p-6 pb-2 md:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Detalhes dos Pagamentos
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Revise os lançamentos e exclua pagamentos duplicados ou incorretos.
                  </p>
                </div>
                {uniqueTransactions.length > 0 && (
                  <Badge variant="outline" className="text-xs font-mono w-fit">
                    {uniqueTransactions.length} {uniqueTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0 md:p-6 pt-0">
                {isOverpaid && (
                  <div className="mx-2 md:mx-0 mb-4 p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <span className="font-bold">Aviso de Recebimento Excessivo: </span>
                      O total líquido recebido ({formatCurrency(totals.netBRL)}) é superior ao valor do pedido ({formatCurrency(expectedAmount)}). 
                      Caso haja lançamentos duplicados gerados após cancelamentos ou re-lançamentos, utilize o botão de lixeira na coluna de Ações abaixo para excluir o lançamento excedente.
                    </div>
                  </div>
                )}

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[85px]">Data</TableHead>
                        <TableHead className="w-[105px]">Tipo</TableHead>
                        <TableHead className="min-w-[180px]">Descrição / Origem</TableHead>
                        <TableHead className="min-w-[120px]">Conta Corrente</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Valor (BRL)</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Valor (Au)</TableHead>
                        <TableHead className="w-[60px] text-center">Ações</TableHead>
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
                            <TableCell className="text-xs text-muted-foreground font-medium max-w-[220px] truncate" title={transacao.descricao || 'Recebimento de Venda'}>
                              {transacao.descricao || 'Recebimento de Venda'}
                            </TableCell>
                            <TableCell className="text-xs font-medium">{transacao.displayAccount || 'N/A'}</TableCell>
                            <TableCell className={`text-right text-xs font-bold tabular-nums whitespace-nowrap ${isDebit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {isDebit ? '-' : '+'} {formatCurrency(Math.abs(Number(transacao.valor)))}
                            </TableCell>
                            <TableCell className={`text-right text-xs font-bold tabular-nums whitespace-nowrap ${isDebit ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
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
                    <div className="flex justify-between items-center px-4 py-3 bg-muted/40 border-t rounded-b-lg text-xs">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider">
                        Total Líquido Recebido:
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-foreground font-mono text-sm">
                          {formatCurrency(totals.netBRL)}
                        </span>
                        <span className="text-muted-foreground">|</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">
                          {formatGrams(totals.netGold)} g Au
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-2 p-2">
                  {uniqueTransactions.map((transacao) => {
                    const isDebit = transacao.tipo === 'DEBITO';
                    return (
                      <div
                        key={transacao.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 ${
                          isDebit
                            ? "bg-red-50/20 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                            : "bg-card border-border/80"
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

                        <div className="flex justify-between items-baseline border-t pt-2 mt-1 border-border/40">
                          <span className={`text-sm font-black tabular-nums ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                            {isDebit ? '-' : '+'} {formatCurrency(Math.abs(Number(transacao.valor)))}
                          </span>
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            {isDebit ? '-' : '+'} {formatGrams(Math.abs(Number(transacao.goldAmount)))} g
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {uniqueTransactions.length > 0 && (
                    <div className="p-3 bg-muted/40 rounded-xl border flex justify-between items-center text-xs">
                      <span className="font-bold uppercase text-[10px] text-muted-foreground">Total Líquido:</span>
                      <div className="text-right">
                        <p className="font-black text-foreground">{formatCurrency(totals.netBRL)}</p>
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{formatGrams(totals.netGold)} g Au</p>
                      </div>
                    </div>
                  )}
                </div>

                {uniqueTransactions.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground italic">Nenhum pagamento registrado.</div>
                )}
              </CardContent>
            </Card>

            {/* Itens da Venda */}
            <Card className="border-none md:border shadow-none md:shadow-sm">
              <CardHeader className="p-2 md:p-6 pb-0 md:pb-6">
                <CardTitle className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Itens da Venda</CardTitle>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead className="text-center">Qtd.</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.saleItems?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell>
                            {item.saleItemLots && item.saleItemLots.length > 0
                              ? item.saleItemLots.map((sl: any) => sl.inventoryLot?.batchNumber).filter(Boolean).join(', ')
                              : item.inventoryLotId || 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                            {isSalProduct(item.product?.name) && item.product?.goldValue ? item.product.goldValue > 0 && (
                              <div className="text-[10px] text-amber-600 font-bold">
                                ({formatGrams(item.quantity * item.product.goldValue)} {getMetalLabel(item.product?.name)})
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Items List */}
                <div className="md:hidden divide-y divide-zinc-100 italic max-w-sm mx-auto">
                  {sale.saleItems?.map((item) => (
                    <div key={item.id} className="p-4 gap-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <span className="font-black text-zinc-900 leading-tight uppercase tracking-tight">{item.product.name}</span>
                        <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full font-bold text-zinc-500 uppercase">
                          LT: {item.saleItemLots && item.saleItemLots.length > 0
                            ? item.saleItemLots.map((sl: any) => sl.inventoryLot?.batchNumber).filter(Boolean).join(', ')
                            : item.inventoryLotId || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-zinc-500 font-bold">
                          QTD: {item.quantity}
                          {isSalProduct(item.product?.name) && item.product?.goldValue ? item.product.goldValue > 0 && (
                            <span className="text-amber-600 ml-1">
                              ({formatGrams(item.quantity * item.product.goldValue)} {getMetalLabel(item.product?.name)})
                            </span>
                          ) : null}
                        </span>
                        <span className="font-bold text-zinc-950">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            {/* @ts-ignore */}
            {sale.observation && (
              <Card className="border-none md:border shadow-none md:shadow-sm">
                <CardHeader className="p-2 md:p-6 pb-0 md:pb-6">
                  <CardTitle className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Observações</CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                  {/* @ts-ignore */}
                  <p className="text-sm whitespace-pre-wrap">{sale.observation}</p>
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

            <DialogFooter className="p-4 pt-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>

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
          </>
        ) : (
          <p>Não foi possível carregar os detalhes.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}