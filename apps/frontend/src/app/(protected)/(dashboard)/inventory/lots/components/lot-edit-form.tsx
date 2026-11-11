'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

const formSchema = z.object({
  batchNumber: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'Custo não pode ser negativo'),
  remainingQuantity: z.coerce.number().min(0, 'Saldo não pode ser negativo'),
  notes: z.string().optional(),
});

interface LotEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  lot: any;
}

export function LotEditForm({
  open,
  onOpenChange,
  onSuccess,
  lot,
}: LotEditFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchNumber: '',
      costPrice: 0,
      remainingQuantity: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (lot) {
      form.reset({
        batchNumber: lot.batchNumber || '',
        costPrice: Number(lot.costPrice) || 0,
        remainingQuantity: Number(lot.remainingQuantity) || 0,
        notes: lot.notes || '',
      });
    }
  }, [lot, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await api.patch(`/stock/lots/${lot.id}`, values);
      toast.success('Lote de estoque atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar lote.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Lote de Estoque</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          Ajustando o lote para: <span className="font-semibold text-foreground">{lot?.product?.name}</span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Número do Lote (Batch)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1204" {...field} className="bg-input text-input-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remainingQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Saldo Restante ({lot?.product?.stockUnit || 'g'})
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} className="bg-input text-input-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Custo Unitário (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} className="bg-input text-input-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Motivo / Observações</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Acerto de inventário" {...field} className="bg-input text-input-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-foreground hover:bg-accent">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary-hover">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
