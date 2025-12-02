import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const schema = z.object({
  chemicalAnalysisIds: z.array(z.string().min(1, 'Obrigatório')),
  status: z.string(),
  dataInicio: z.string(),
  descricaoProcesso: z.string().optional(),
  volumeProcessado: z.coerce.number().optional(),
  unidadeProcessada: z.string().optional(),
  resultadoFinal: z.coerce.number().optional(),
  unidadeResultado: z.string().optional(),
  observacoes: z.string().optional(),
});

type RecoveryOrderFormValues = z.infer<typeof schema>;

interface RecoveryOrderFormProps {
  onSubmit: (values: RecoveryOrderFormValues) => void;
  initialValues?: Partial<RecoveryOrderFormValues>;
  isLoading?: boolean;
}

export function RecoveryOrderForm({ onSubmit, initialValues, isLoading }: RecoveryOrderFormProps) {
  const form = useForm<RecoveryOrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || { status: 'PENDENTE', dataInicio: new Date().toISOString().slice(0,10) },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Recovery Order</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="chemicalAnalysisIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IDs das Análises Químicas*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dataInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início*</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricaoProcesso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Processo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <Button type="submit" disabled={isLoading || form.formState.isSubmitting} className="w-full">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
