'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Decimal from 'decimal.js';
import { useForm, Controller } from 'react-hook-form';

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

interface SaleDetailsModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function SaleDetailsModal({ sale: initialSale, open, onOpenChange, onSave }: SaleDetailsModalProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && initialSale) {
      setIsLoading(true);
      api.get(`/sales/${initialSale.id}`)
        .then(res => setSale(res.data))
        .catch(() => toast.error("Falha ao carregar dados detalhados da venda."))
        .finally(() => setIsLoading(false));
    }
  }, [open, initialSale]);

  const getPaymentInfo = () => {
    if (!sale) return 'N/A';
    // Check if there are any paid installments
    const paidInstallments = sale.installments?.filter(inst => inst.status === 'PAID');
    if (paidInstallments && paidInstallments.length > 0) {
      return 'Pago';
    }
    // Check if there are any pending installments
    const pendingInstallments = sale.installments?.filter(inst => inst.status === 'PENDING' || inst.status === 'OVERDUE');
    if (pendingInstallments && pendingInstallments.length > 0) {
      return 'A Receber';
    }
    // Fallback for other payment methods or if no installments (e.g., METAL, A_VISTA)
    return sale.paymentMethod?.replace('_', ' ') || 'Pendente';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda #{sale?.orderNumber}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p>Carregando...</p>
        ) : sale ? (
          <>
            <div className="space-y-6 p-4">
              {/* Detalhes do Cliente e Venda */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h3 className="font-semibold">Cliente</h3>
                  <p className="text-muted-foreground">{sale.pessoa.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {`${sale.pessoa.logradouro || ''}, ${sale.pessoa.numero || ''}`}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {`${sale.pessoa.bairro || ''} - ${sale.pessoa.cidade || ''}/${sale.pessoa.uf || ''}`}
                  </p>
                  <p className="text-muted-foreground text-sm">{`CEP: ${sale.pessoa.cep || ''}`}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold">Data da Venda</h3>
                  <p className="text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                  <h3 className="font-semibold mt-2">Status do Pagamento</h3>
                  <p className="text-muted-foreground font-bold">{getPaymentInfo()}</p>
                </div>
              </div>

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
                          <TableCell>{item.inventoryLotId?.substring(0, 8) || 'N/A'}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Installments List */}
              {sale.installments && sale.installments.length > 0 && (
                <InstallmentList installments={sale.installments} />
              )}

            </div>
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
  }0