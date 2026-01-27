'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SaleAdjustmentCalcMethod } from '@prisma/client';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  description: z.string().optional(),
  isReactionProductGroup: z.boolean().default(false),
  adjustmentCalcMethod: z.nativeEnum(SaleAdjustmentCalcMethod),
});

export type ProductGroupFormValues = z.infer<typeof formSchema>;

interface ProductGroupFormProps {
  onSubmit: (values: ProductGroupFormValues) => void;
  defaultValues?: Partial<ProductGroupFormValues>;
  isSubmitting: boolean;
}

export function ProductGroupForm({ onSubmit, defaultValues, isSubmitting }: ProductGroupFormProps) {
  const form = useForm<ProductGroupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isReactionProductGroup: false,
      adjustmentCalcMethod: SaleAdjustmentCalcMethod.QUANTITY_BASED,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Revenda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição do grupo..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="adjustmentCalcMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Cálculo do Ajuste</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um método" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SaleAdjustmentCalcMethod.QUANTITY_BASED}>Baseado na Quantidade</SelectItem>
                  <SelectItem value={SaleAdjustmentCalcMethod.COST_BASED}>Baseado no Custo</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Define como a discrepância em gramas é calculada para produtos deste grupo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isReactionProductGroup"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>É um Grupo de Reação?</FormLabel>
                <FormDescription>
                  Marque se os produtos deste grupo são gerados por reações químicas.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Form>
  );
}
