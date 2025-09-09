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
  analiseQuimicaId: z.string().min(1, 'Obrigatório'),
  status: z.string(),
  dataInicio: z.string(),
  descricaoProcesso: z.string().optional(),
  volumeProcessado: z.coerce.number().optional(),
  unidadeProcessada: z.string().optional(),
  resultadoFinal: z.coerce.number().optional(),
  unidadeResultado: z.string().optional(),
  observacoes: z.string().optional(),
});

type RecuperacaoFormValues = z.infer<typeof schema>;

interface RecuperacaoFormProps {
  onSubmit: (values: RecuperacaoFormValues) => void;
  initialValues?: Partial<RecuperacaoFormValues>;
  isLoading?: boolean;
}

export function RecuperacaoForm({ onSubmit, initialValues, isLoading }: RecuperacaoFormProps) {
  const form = useForm<RecuperacaoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || { status: 'PENDENTE', dataInicio: new Date().toISOString().slice(0,10) },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Recuperação</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="analiseQuimicaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID da Análise Química*</FormLabel>
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
