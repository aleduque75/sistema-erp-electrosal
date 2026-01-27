import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormCombobox } from '@/components/ui/FormCombobox';
import { Sale } from '../page';

interface ApplyCommissionModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Salesperson {
  id: string;
  name: string;
}

export function ApplyCommissionModal({
  sale,
  open,
  onOpenChange,
  onSuccess,
}: ApplyCommissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string | null>(null);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);

  useEffect(() => {
    if (open) {
      api.get('/pessoas?role=FUNCIONARIO').then(response => {
        setSalespeople(response.data);
      }).catch(() => {
        toast.error('Falha ao buscar vendedores.');
      });

      if (sale) {
        setSelectedSalespersonId(sale.salespersonId || null);
        setCommissionAmount(Number(sale.commissionAmount) || 0);
      }
    }
  }, [open, sale]);

  const handleApply = async () => {
    if (!sale || !selectedSalespersonId) {
      toast.error('Selecione um vendedor.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/sales/${sale.id}/apply-commission`, {
        salespersonId: selectedSalespersonId,
        commissionAmount,
      });
      toast.success('Comissão aplicada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Falha ao aplicar comissão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar Comissão - Pedido #{sale.orderNumber}</DialogTitle>
          <DialogDescription>
            Informe o vendedor e o valor da comissão. Isso irá gerar um contas a pagar e atualizar o lucro da venda.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Vendedor</Label>
            <FormCombobox
              items={salespeople.map(s => ({ value: s.id, label: s.name }))}
              value={selectedSalespersonId}
              onSelect={setSelectedSalespersonId}
              triggerPlaceholder="Selecione um vendedor..."
              searchPlaceholder="Buscar vendedor..."
            />
          </div>

          <div className="space-y-2">
            <Label>Valor da Comissão (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={commissionAmount}
              onChange={(e) => setCommissionAmount(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleApply} disabled={isSubmitting || !selectedSalespersonId}>
            {isSubmitting ? 'Aplicando...' : 'Aplicar Comissão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
