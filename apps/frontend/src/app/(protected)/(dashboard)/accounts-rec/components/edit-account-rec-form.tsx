'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Scissors } from 'lucide-react';

interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  received: boolean;
  receivedAt?: string | null;
  amountPaid?: number;
}

interface EditAccountRecFormProps {
  accountRec: AccountRec;
  onSave: () => void;
  onOpenSplit?: () => void;
}

const formSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Informe um valor numérico válido.' })
    .min(0.01, 'O valor deve ser no mínimo R$ 0,01.'),
  dueDate: z.string().min(1, 'A data de vencimento é obrigatória.'),
});

const getFormattedDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  if (dateStr.includes('T')) return dateStr.split('T')[0];
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
};

export function EditAccountRecForm({ accountRec, onSave, onOpenSplit }: EditAccountRecFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: accountRec.description,
      amount: accountRec.amount,
      dueDate: getFormattedDate(accountRec.dueDate),
    },
  });

  useEffect(() => {
    form.reset({
      description: accountRec.description,
      amount: accountRec.amount,
      dueDate: getFormattedDate(accountRec.dueDate),
    });
  }, [accountRec, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await api.patch(`/accounts-rec/${accountRec.id}`, {
        ...data,
        amount: Number(data.amount),
      });
      toast.success('Conta a receber atualizada com sucesso!');
      onSave();
    } catch (err: any) {
      const errorMessages = err.response?.data?.message;
      const displayMessage = Array.isArray(errorMessages) ? errorMessages.join(', ') : (errorMessages || 'Ocorreu um erro.');
      toast.error(displayMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                  value={field.value !== undefined && field.value !== null ? field.value : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? '' : Number(val));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Vencimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>

        {!accountRec.received && Number(accountRec.amountPaid || 0) === 0 && onOpenSplit && (
          <div className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onOpenSplit}
              className="w-full gap-2 text-xs border-dashed text-primary hover:text-primary hover:bg-primary/5"
            >
              <Scissors className="h-3.5 w-3.5" />
              Dividir este Vencimento em Parcelas
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
