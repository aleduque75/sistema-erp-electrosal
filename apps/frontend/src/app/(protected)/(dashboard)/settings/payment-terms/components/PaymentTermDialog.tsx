'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentTerm } from '../page';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  installmentsDays: z.string().min(1, 'Dias das parcelas é obrigatório'),
  interestRate: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentTermDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
  paymentTerm: PaymentTerm | null;
}

export function PaymentTermDialog({ isOpen, onOpenChange, onSave, paymentTerm }: PaymentTermDialogProps) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      installmentsDays: '',
      interestRate: 0,
    },
  });

  useEffect(() => {
    if (paymentTerm) {
      reset({
        name: paymentTerm.name,
        description: paymentTerm.description || '',
        installmentsDays: paymentTerm.installmentsDays.join(', '),
        interestRate: paymentTerm.interestRate || 0,
      });
    } else {
      reset({
        name: '',
        description: '',
        installmentsDays: '',
        interestRate: 0,
      });
    }
  }, [paymentTerm, reset]);

  const onSubmit = async (data: FormValues) => {
    const installmentsDays = data.installmentsDays.split(',').map(day => parseInt(day.trim(), 10));
    const payload = { ...data, installmentsDays };

    try {
      if (paymentTerm) {
        await api.patch(`/payment-terms/${paymentTerm.id}`, payload);
        toast.success('Prazo de pagamento atualizado com sucesso!');
      } else {
        await api.post('/payment-terms', payload);
        toast.success('Prazo de pagamento criado com sucesso!');
      }
      onSave();
    } catch (error) {
      toast.error('Falha ao salvar o prazo de pagamento.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{paymentTerm ? 'Editar Prazo de Pagamento' : 'Novo Prazo de Pagamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div>
                <Label>Nome</Label>
                <Input {...field} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div>
                <Label>Descrição</Label>
                <Input {...field} />
              </div>
            )}
          />
          <Controller
            name="installmentsDays"
            control={control}
            render={({ field }) => (
              <div>
                <Label>Dias das Parcelas (separados por vírgula)</Label>
                <Input {...field} />
                {errors.installmentsDays && <p className="text-red-500 text-sm">{errors.installmentsDays.message}</p>}
              </div>
            )}
          />
          <Controller
            name="interestRate"
            control={control}
            render={({ field }) => (
              <div>
                <Label>Taxa de Juros (%)</Label>
                <Input type="number" {...field} />
              </div>
            )}
          />
          <DialogFooter>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
