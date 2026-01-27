'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Decimal from 'decimal.js';
import { useForm, Controller } from 'react-hook-form';
import { RotateCcw, User, MapPin, Calendar, CreditCard } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

interface SaleDetailsModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function SaleDetailsModal({ sale: initialSale, open, onOpenChange, onSave }: SaleDetailsModalProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setIsPageLoading] = useState(true);

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
    } catch (err) {
      toast.error("Falha ao recalcular ajuste.");
    } finally {
      setIsPageLoading(false);
    }
  };

  const getPaymentInfo = () => {
    if (!sale) return 'N/A';

    const receivedAccounts = sale.accountsRec?.filter(ar => ar.received) || [];

    if (receivedAccounts.length > 0) {
      const accountNames = receivedAccounts.flatMap(ar => ar.transacoes?.map(t => t.contaCorrente?.nome)).filter(Boolean).join(', ');
      return `Recebido em: ${accountNames}`;
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
    
    const transactions = [
      ...(sale.accountsRec?.flatMap(ar => ar.transacoes || []) || []),
      ...(sale.installments?.flatMap(inst => inst.accountRec?.transacoes || []) || [])
    ];

    const uniqueMap = new Map();
    transactions.forEach(t => {
        if (t && t.id) {
            uniqueMap.set(t.id, t);
        }
    });

    return Array.from(uniqueMap.values());
  }, [sale]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
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
                          <span>{formatCurrency(sale.adjustment.paymentQuotation)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Equivalente em Ouro:</span>
                          <span>{formatGrams(sale.adjustment.paymentEquivalentGrams)} g</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Variação Cotação:</span>
                          <span className={`font-bold ${sale.adjustment.grossDiscrepancyGrams > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatDecimal(
                              (sale.adjustment.grossDiscrepancyGrams /
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
              <Card>
                <CardHeader><CardTitle>Detalhes dos Pagamentos</CardTitle></CardHeader>
                <CardContent>
                  <Table size="sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Conta Corrente</TableHead>
                        <TableHead className="text-right">Valor (BRL)</TableHead>
                        <TableHead className="text-right">Valor (Au)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueTransactions.map((transacao) => (
                        <TableRow key={transacao.id}>
                          <TableCell>{formatDate(transacao.dataHora)}</TableCell>
                          <TableCell>{transacao.contaCorrente?.nome || 'N/A'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(transacao.valor)}</TableCell>
                          <TableCell className="text-right">{formatGrams(transacao.goldAmount)} g</TableCell>
                        </TableRow>
                      ))}
                      {/* Mensagem se não houver pagamentos */}
                      {uniqueTransactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum pagamento registrado.</TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Itens da Venda */}
              <Card>
                <CardHeader><CardTitle>Itens da Venda</CardTitle></CardHeader>
                <CardContent>
                  <Table size="sm">
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
                          <TableCell>{item.inventoryLot?.batchNumber || 'N/A'}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Observações */}
              {sale.observation && (
                <Card>
                  <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{sale.observation}</p>
                  </CardContent>
                </Card>
              )}

              {/* Installments List */}
              {sale.installments && sale.installments.length > 0 && (
                <InstallmentList installments={sale.installments} />
              )}

            <DialogFooter className="p-4 pt-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </>
        ) : (
          <p>Não foi possível carregar os detalhes.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}