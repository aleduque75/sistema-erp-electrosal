'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import api from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Tipos para os dados vindos da API
interface PureMetalLot {
  id: string;
  sourceType: string;
  sourceId: string;
  remainingGrams: number;
  purity: number;
}

interface AvailableLeftover {
  id: string;
  type: string;
  grams: number;
}

const formSchema = z.object({
  gramsToUse: z.coerce.number().positive('A quantidade de ouro deve ser positiva.'),
  sourceLotId: z.string().min(1, 'Selecione um lote de metal.'),
  leftoversUsedIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export function NewReactionForm() {
  const router = useRouter();
  const [pureMetalLots, setPureMetalLots] = useState<PureMetalLot[]>([]);
  const [availableLeftovers, setAvailableLeftovers] = useState<AvailableLeftover[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        const [lotsRes, leftoversRes] = await Promise.all([
          api.get('/pure-metal-lots/available'), // TODO: Create this endpoint
          api.get('/chemical-reactions/leftovers/available'),
        ]);
        setPureMetalLots(lotsRes.data);
        setAvailableLeftovers(leftoversRes.data);
      } catch (error) {
        toast.error('Erro ao buscar dados', { description: 'Não foi possível carregar os lotes e sobras. Tente novamente.' });
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gramsToUse: 0,
      leftoversUsedIds: [],
      notes: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await api.post('/chemical-reactions', values);
      toast.success('Sucesso!', { description: 'A reação química foi iniciada.' });
      router.push('/producao/reacoes-quimicas');
      router.refresh();
    } catch (error: any) {
      toast.error('Erro ao iniciar reação', { description: error.response?.data?.message || 'Ocorreu um erro desconhecido' });
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="gramsToUse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ouro a Utilizar (g)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100.00" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>
                  A quantidade de ouro puro (Au) que será usada como insumo principal.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sourceLotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lote de Metal de Origem</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingData || isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingData ? 'Carregando lotes...' : 'Selecione o lote de origem...'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pureMetalLots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {`Lote ${lot.sourceId} - ${lot.remainingGrams}g @ ${lot.purity * 100}%`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="leftoversUsedIds"
          render={({ field }) => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Sobras a Utilizar</FormLabel>
                <FormDescription>
                  Selecione as sobras de reações anteriores que serão reaproveitadas.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {isLoadingData && <p>Carregando sobras...</p>}
                {availableLeftovers.map((item) => (
                  <FormItem
                    key={item.id}
                    className="flex flex-row items-start space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(item.id)}
                        onCheckedChange={(checked) => {
                          const updatedValue = checked
                            ? [...(field.value || []), item.id]
                            : field.value?.filter((value) => value !== item.id);
                          field.onChange(updatedValue);
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {`${item.type} - ${Number(item.grams).toFixed(2)}g`}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione qualquer observação relevante sobre a reação..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoadingData || isSubmitting}>
          {isSubmitting ? 'Iniciando...' : 'Iniciar Reação'}
        </Button>
      </form>
    </Form>
  );
}
