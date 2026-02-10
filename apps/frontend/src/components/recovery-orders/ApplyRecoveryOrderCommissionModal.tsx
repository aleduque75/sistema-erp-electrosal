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
import { RecoveryOrder } from '@/types/recovery-order';

interface ApplyRecoveryOrderCommissionModalProps {
  recoveryOrder: RecoveryOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Salesperson {
  id: string;
  name: string;
}

export function ApplyRecoveryOrderCommissionModal({
  recoveryOrder,
  open,
  onOpenChange,
  onSuccess,
}: ApplyRecoveryOrderCommissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string | null>(null);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(0);

  useEffect(() => {
    if (open) {
      api.get('/pessoas?role=FUNCIONARIO').then(response => {
        setSalespeople(response.data);
      }).catch(() => {
        toast.error('Falha ao buscar vendedores.');
      });

      if (recoveryOrder) {
        setSelectedSalespersonId(recoveryOrder.salespersonId || null);
        setCommissionAmount(Number(recoveryOrder.commissionAmount) || 0);
        setCommissionPercentage(Number(recoveryOrder.commissionPercentage) || 0);
      }
    }
  }, [open, recoveryOrder]);

  const handleApply = async () => {
    if (!recoveryOrder || !selectedSalespersonId) {
      toast.error('Selecione um vendedor.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/recovery-orders/${recoveryOrder.id}/apply-commission`, {
        salespersonId: selectedSalespersonId,
        commissionAmount,
        commissionPercentage,
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

  if (!recoveryOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar Comissão - Ordem #{recoveryOrder.orderNumber}</DialogTitle>
          <DialogDescription>
            Informe o vendedor e o valor da comissão. Isso irá gerar um contas a pagar mesmo que a ordem já esteja finalizada.
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Comissão (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Fixo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(Number(e.target.value))}
              />
            </div>
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
