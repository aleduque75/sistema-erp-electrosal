'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sale } from '../page';

interface ConfirmSaleModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export function ConfirmSaleModal({
  sale,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmSaleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!sale) return;

    setIsSubmitting(true);
    try {
      const payload = {
        paymentMethod: sale.paymentMethod,
        // Adicionar outros campos do DTO se necessário, ex: numberOfInstallments
      };

      await api.post(`/sales/${sale.id}/confirm`, payload);
      toast.success('Venda confirmada com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Falha ao confirmar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Venda #{sale.orderNumber}</DialogTitle>
          <DialogDescription>
            Você confirma os detalhes desta venda? Esta ação irá gerar os lançamentos financeiros.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 rounded-lg border p-4">
            <p><span className="font-semibold">Cliente:</span> {sale.pessoa.name}</p>
            <p><span className="font-semibold">Valor Final:</span> {formatCurrency(sale.netAmount)}</p>
            <p><span className="font-semibold">Método de Pagamento:</span> {sale.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Confirmando...' : 'Confirmar Venda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
