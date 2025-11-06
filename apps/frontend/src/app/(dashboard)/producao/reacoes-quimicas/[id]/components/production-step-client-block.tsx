'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { ReactionLeftoverType } from '@prisma/client'; // Removido
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

// Definir o enum localmente para evitar problemas de importação do Prisma Client no frontend
enum ReactionLeftoverType {
  BASKET = 'BASKET',
  DISTILLATE = 'DISTILLATE',
}

const formSchema = z.object({
  outputProductGrams: z.coerce.number().positive('A quantidade produzida deve ser positiva.'),
  outputBasketLeftoverGrams: z.coerce.number().min(0, 'A quantidade do cesto não pode ser negativa.').default(0),
  outputDistillateLeftoverGrams: z.coerce.number().min(0, 'A quantidade do destilado não pode ser negativa.').default(0),
});

function CompleteProductionStepForm({ reactionId, auUsedGrams, setIsOpen }: { reactionId: string; auUsedGrams: number; setIsOpen: (open: boolean) => void }) {
  const router = useRouter();
  const [reactionDetails, setReactionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/chemical-reactions/${reactionId}`)
      .then(res => {
        console.log("Reaction Details from API:", res.data);
        setReactionDetails(res.data);
      })
      .finally(() => setIsLoading(false));
  }, [reactionId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outputProductGrams: 0,
      outputBasketLeftoverGrams: 0,
      outputDistillateLeftoverGrams: 0,
    }
  });

  const { setValue, getValues } = form;

  const outputProductGrams = form.watch('outputProductGrams');
  const outputBasketLeftoverGrams = form.watch('outputBasketLeftoverGrams');
  const outputDistillateLeftoverGrams = form.watch('outputDistillateLeftoverGrams');

  const goldInProduct = useMemo(() => {
    const goldValue = reactionDetails?.outputProduct?.goldValue || 0;
    const gp = Number(outputProductGrams);
    return isNaN(gp) ? 0 : gp * goldValue;
  }, [outputProductGrams, reactionDetails]);

  // Efeito para avisar sobre teor de ouro zerado (Causa do bug de input)
  useEffect(() => {
    const goldValue = reactionDetails?.outputProduct?.goldValue || 0;
    if (reactionDetails && goldValue === 0 && Number(outputProductGrams) > 0) {
      toast.warning("Teor de ouro do produto é 0%", { description: "O cálculo de ouro no produto final está zerado. Verifique o cadastro do produto." });
    }
  }, [outputProductGrams, reactionDetails]);



  const totalOutputGold = useMemo(() => {
    return goldInProduct + (Number(outputBasketLeftoverGrams) || 0) + (Number(outputDistillateLeftoverGrams) || 0);
  }, [goldInProduct, outputBasketLeftoverGrams, outputDistillateLeftoverGrams]);

  const balance = useMemo(() => {
    return auUsedGrams - totalOutputGold;
  }, [auUsedGrams, totalOutputGold]);

  const isBalanceZero = useMemo(() => Math.abs(balance) < 0.001, [balance]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await api.patch(`/chemical-reactions/${reactionId}/complete-production`, values);
      toast.success('Sucesso!', { description: 'A etapa de produção foi completada e o estoque foi atualizado.' });
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error('Erro ao completar etapa de produção', { description: error.response?.data?.message || 'Ocorreu um erro desconhecido' });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="outputProductGrams" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Gramas Produzidas (g Sal)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="441.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField name="outputBasketLeftoverGrams" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Sobra de Cesto (g Au)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="100.0" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="outputDistillateLeftoverGrams" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Sobra de Destilado (g Au)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="59.08" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Separator />

        {isLoading ? (
          <p className="text-center text-muted-foreground">Carregando detalhes do produto...</p>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Ouro Utilizado (Entrada):</Label>
              <Badge variant="secondary" className="text-lg p-2">
                {Number(auUsedGrams).toFixed(4)} g Au
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <Label>Ouro na Saída (Produto + Sobras):</Label>
              <Badge variant="secondary" className="text-lg p-2">
                {totalOutputGold.toFixed(4)} g Au
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-bold text-xl">
              <Label>Saldo de Ouro:</Label>
              <div className="flex items-center gap-2">
                <Badge variant={isBalanceZero ? "default" : "destructive"} className="text-lg p-2">
                  {balance.toFixed(4)} g Au
                </Badge>
                {isBalanceZero && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting || !isBalanceZero}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Completar Etapa de Produção'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function ProductionStepClientBlock({ reactionId, auUsedGrams }: { reactionId: string; auUsedGrams: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Completar Etapa de Produção</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Completar Etapa de Produção</DialogTitle>
          <DialogDescription>Insira os resultados da produção para atualizar o estoque.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CompleteProductionStepForm reactionId={reactionId} auUsedGrams={auUsedGrams} setIsOpen={setIsOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}