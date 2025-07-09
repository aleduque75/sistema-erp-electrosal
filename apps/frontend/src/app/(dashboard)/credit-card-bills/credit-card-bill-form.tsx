'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format, parse } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';

const formSchema = z.object({
  name: z.string().min(3, "O nome da fatura é obrigatório."),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória."}),
});

type FormValues = z.infer<typeof formSchema>;

interface FormProps {
  bill?: FormValues & { id: string };
  onSave: () => void;
}

export function CreditCardBillForm({ bill, onSave }: FormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bill?.name || '',
      dueDate: bill?.dueDate ? new Date(bill.dueDate) : new Date(),
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!bill) return;
    try {
      await api.patch(`/credit-card-bills/${bill.id}`, data);
      toast.success('Fatura atualizada com sucesso!');
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ocorreu um erro.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome da Fatura</FormLabel><FormControl><Input placeholder="Ex: Fatura de Agosto" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField name="dueDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Data de Vencimento</FormLabel><FormControl><DateInput value={field.value ? format(field.value, 'dd/MM/yyyy') : ''} onAccept={(val: any) => field.onChange(parse(val, 'dd/MM/yyyy', new Date()))} placeholder="DD/MM/AAAA" /></FormControl><FormMessage /></FormItem>)} />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}