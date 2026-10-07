'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Wand2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { splitAccountRec, SplitInstallmentItem } from '@/services/accountsRecApi';
import { formatDate } from '@/lib/date-utils';

interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  received: boolean;
  amountPaid?: number;
  sale?: {
    orderNumber?: number;
  };
}

interface SplitAccountRecModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountRec: AccountRec | null;
  onSuccess: () => void;
}

interface InstallmentRow extends SplitInstallmentItem {
  id: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const addDaysToDate = (baseDateStr: string, days: number): string => {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export function SplitAccountRecModal({
  isOpen,
  onClose,
  accountRec,
  onSuccess,
}: SplitAccountRecModalProps) {
  const [quickCount, setQuickCount] = useState<number>(2);
  const [quickIntervalDays, setQuickIntervalDays] = useState<number>(30);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Limpa o nome base da descrição
  const getCleanDescription = (desc: string) => {
    return desc
      .replace(/\s*-\s*Parcela\s*\d+\/\d+/gi, '')
      .replace(/\s*\(A Combinar\)/gi, '')
      .trim();
  };

  const generateInstallments = (count: number, intervalDays: number) => {
    if (!accountRec) return;
    const total = Number(accountRec.amount) || 0;
    const baseDueDate = accountRec.dueDate
      ? new Date(accountRec.dueDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const cleanDesc = getCleanDescription(accountRec.description);

    // Divisão de centavos precisa
    const equalShare = Math.floor((total / count) * 100) / 100;
    const remainder = Math.round((total - equalShare * count) * 100) / 100;

    const newRows: InstallmentRow[] = [];
    for (let i = 0; i < count; i++) {
      const amount = i === 0 ? Number((equalShare + remainder).toFixed(2)) : equalShare;
      const dueDate = i === 0 ? baseDueDate : addDaysToDate(baseDueDate, i * intervalDays);
      newRows.push({
        id: `row-${Date.now()}-${i}`,
        amount,
        dueDate,
        description: `${cleanDesc} - Parcela ${i + 1}/${count}`,
      });
    }
    setInstallments(newRows);
  };

  useEffect(() => {
    if (accountRec && isOpen) {
      setQuickCount(2);
      setQuickIntervalDays(30);
      generateInstallments(2, 30);
    }
  }, [accountRec, isOpen]);

  if (!accountRec) return null;

  const totalOriginal = Number(accountRec.amount) || 0;
  const sumCurrent = installments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const difference = Math.round((totalOriginal - sumCurrent) * 100) / 100;
  const isBalanced = Math.abs(difference) < 0.01;

  const handleUpdateRow = (index: number, field: keyof SplitInstallmentItem, value: any) => {
    setInstallments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddRow = () => {
    const cleanDesc = getCleanDescription(accountRec.description);
    const lastRow = installments[installments.length - 1];
    const nextDate = lastRow?.dueDate
      ? addDaysToDate(lastRow.dueDate, 30)
      : new Date().toISOString().split('T')[0];

    const newCount = installments.length + 1;
    const newRows = installments.map((row, idx) => ({
      ...row,
      description: row.description?.includes('Parcela')
        ? `${cleanDesc} - Parcela ${idx + 1}/${newCount}`
        : row.description,
    }));

    newRows.push({
      id: `row-${Date.now()}-${newCount}`,
      amount: difference > 0 ? difference : 0,
      dueDate: nextDate,
      description: `${cleanDesc} - Parcela ${newCount}/${newCount}`,
    });

    setInstallments(newRows);
  };

  const handleRemoveRow = (index: number) => {
    if (installments.length <= 2) {
      toast.error('O lançamento deve conter pelo menos 2 parcelas.');
      return;
    }
    const cleanDesc = getCleanDescription(accountRec.description);
    const filtered = installments.filter((_, idx) => idx !== index);
    const newCount = filtered.length;
    const renumbered = filtered.map((row, idx) => ({
      ...row,
      description: row.description?.includes('Parcela')
        ? `${cleanDesc} - Parcela ${idx + 1}/${newCount}`
        : row.description,
    }));
    setInstallments(renumbered);
  };

  const handleAdjustRemainderOnLast = () => {
    if (installments.length === 0) return;
    setInstallments((prev) => {
      const copy = [...prev];
      const lastIndex = copy.length - 1;
      const othersSum = copy
        .slice(0, lastIndex)
        .reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);
      const newLastAmount = Math.max(0, Math.round((totalOriginal - othersSum) * 100) / 100);
      copy[lastIndex] = { ...copy[lastIndex], amount: newLastAmount };
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!isBalanced) {
      toast.error(
        `A soma das parcelas (${formatCurrency(sumCurrent)}) deve ser exatamente igual a ${formatCurrency(totalOriginal)}.`,
      );
      return;
    }

    const invalidRow = installments.find(
      (item) => !item.amount || item.amount <= 0 || !item.dueDate,
    );
    if (invalidRow) {
      toast.error('Preencha valores maiores que zero e datas válidas para todas as parcelas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await splitAccountRec(
        accountRec.id,
        installments.map((i) => ({
          amount: Number(i.amount),
          dueDate: i.dueDate,
          description: i.description,
        })),
      );

      toast.success(`Lançamento dividido em ${installments.length} parcelas com sucesso!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao dividir lançamento:', error);
      toast.error(error.response?.data?.message || 'Falha ao dividir o lançamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Dividir Lançamento (Desmembrar)</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Desmembre esta conta a receber em múltiplos vencimentos sem comprometer a integridade da venda.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Card Resumo do Lançamento Original */}
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Lançamento Original
                </span>
                <p className="font-semibold text-foreground line-clamp-1">{accountRec.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Vencimento original: {formatDate(accountRec.dueDate)}
                </p>
              </div>
              <div className="text-right sm:border-l sm:pl-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Valor Total
                </span>
                <span className="text-lg font-black text-primary">{formatCurrency(totalOriginal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Gerador Rápido de Parcelas */}
          <div className="bg-muted/20 p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Wand2 className="h-4 w-4 text-primary" />
              <span>Gerar automaticamente em:</span>
              <Input
                type="number"
                min={2}
                max={24}
                value={quickCount}
                onChange={(e) => setQuickCount(Math.max(2, parseInt(e.target.value) || 2))}
                className="w-16 h-8 text-xs text-center"
              />
              <span>parcelas a cada</span>
              <Input
                type="number"
                min={1}
                max={365}
                value={quickIntervalDays}
                onChange={(e) => setQuickIntervalDays(Math.max(1, parseInt(e.target.value) || 30))}
                className="w-16 h-8 text-xs text-center"
              />
              <span>dias</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-8"
              onClick={() => generateInstallments(quickCount, quickIntervalDays)}
            >
              Recalcular
            </Button>
          </div>

          {/* Tabela de Parcelas */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Parcelas do Desmembramento ({installments.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleAddRow}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Parcela
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {installments.map((row, index) => (
                <div
                  key={row.id}
                  className="p-3 rounded-lg border bg-card/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-sm shadow-xs"
                >
                  <div className="flex items-center gap-2 sm:w-20">
                    <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
                      #{index + 1}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <Input
                      type="text"
                      placeholder="Descrição da parcela"
                      value={row.description || ''}
                      onChange={(e) => handleUpdateRow(index, 'description', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <Input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) => handleUpdateRow(index, 'dueDate', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={row.amount || ''}
                        onChange={(e) =>
                          handleUpdateRow(index, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-xs pl-8 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={installments.length <= 2}
                      onClick={() => handleRemoveRow(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Remover parcela"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validação de Saldo e Totais */}
          <div
            className={`p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
              isBalanced
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium">
                    Soma perfeita: {formatCurrency(sumCurrent)} de {formatCurrency(totalOriginal)}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Soma atual: <strong>{formatCurrency(sumCurrent)}</strong>. Diferença de{' '}
                    <strong>{formatCurrency(Math.abs(difference))}</strong>{' '}
                    {difference > 0 ? 'faltando' : 'excedendo'}.
                  </span>
                </>
              )}
            </div>

            {!isBalanced && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px] bg-background text-foreground"
                onClick={handleAdjustRemainderOnLast}
              >
                Ajustar diferença na última parcela
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t flex flex-row items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isBalanced || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Dividindo...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" />
                Confirmar Divisão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
