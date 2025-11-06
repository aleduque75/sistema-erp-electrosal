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

interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  received: boolean;
  receivedAt?: string | null;
}

interface EditAccountRecFormProps {
  accountRec: AccountRec;
  onSave: () => void;
}

const formSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  amount: z.coerce.number().min(0.01, 'O valor deve ser no mínimo R$ 0,01.'),
  dueDate: z.string().min(1, 'A data de vencimento é obrigatória.'),
});

export function EditAccountRecForm({ accountRec, onSave }: EditAccountRecFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: accountRec.description,
      amount: accountRec.amount,
      dueDate: accountRec.dueDate ? new Date(accountRec.dueDate).toISOString().split('T')[0] : '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await api.patch(`/accounts-rec/${accountRec.id}`, {
        ...data,
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
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
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
      </form>
    </Form>
  );
}
