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
  gramsProduced: z.coerce.number().positive('A quantidade produzida deve ser positiva.'),
  basketGrams: z.coerce.number().min(0, 'A quantidade do cesto não pode ser negativa.').default(0),
  distillateGrams: z.coerce.number().min(0, 'A quantidade do destilado não pode ser negativa.').default(0),
});

function CompleteProductionStepForm({ reactionId, auUsedGrams, setIsOpen }: { reactionId: string; auUsedGrams: number; setIsOpen: (open: boolean) => void }) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const gramsProduced = form.watch('gramsProduced');
  const basketGrams = form.watch('basketGrams');
  const distillateGrams = form.watch('distillateGrams');

  const goldInProduct = useMemo(() => {
    const gp = Number(gramsProduced);
    return (isNaN(gp) ? 0 : gp) * 0.682; // Assumindo 68.2% de ouro no sal
  }, [gramsProduced]);

  const totalOutputGold = useMemo(() => {
    const bg = Number(basketGrams);
    const dg = Number(distillateGrams);
    return goldInProduct + (isNaN(bg) ? 0 : bg) + (isNaN(dg) ? 0 : dg);
  }, [goldInProduct, basketGrams, distillateGrams]);

  const remainingGrams = useMemo(() => {
    return auUsedGrams - totalOutputGold;
  }, [auUsedGrams, totalOutputGold]);

  const isBalanceZero = Math.abs(parseFloat(remainingGrams.toFixed(2))) < 1e-9; // Arredondar para 2 casas decimais antes de comparar com zero

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isBalanceZero) {
      toast.error("O saldo de ouro deve ser zero para completar a etapa.");
      return;
    }

    const dataToSend = {
      ...values,
      newLeftovers: [
        { type: ReactionLeftoverType.BASKET, grams: values.basketGrams },
        { type: ReactionLeftoverType.DISTILLATE, grams: values.distillateGrams },
      ],
    };

    try {
      await api.patch(`/chemical-reactions/${reactionId}/complete-production`, dataToSend);
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
        <FormField name="gramsProduced" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Gramas Produzidas (g Sal 68%)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="1250.50" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField name="basketGrams" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Sobra de Cesto (g Au)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="100.0" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField name="distillateGrams" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Sobra de Destilado (g Au)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="50.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Ouro Utilizado (Entrada):</Label>
            <Badge variant="secondary" className="text-lg p-2">
              {auUsedGrams.toFixed(2)} g Au
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <Label>Ouro na Saída (Produto + Sobras):</Label>
            <Badge variant="secondary" className="text-lg p-2">
              {totalOutputGold.toFixed(2)} g Au
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center font-bold text-xl">
            <Label>Saldo de Ouro:</Label>
            <div className="flex items-center gap-2">
              <Badge variant={isBalanceZero ? "default" : "destructive"} className="text-lg p-2">
                {remainingGrams.toFixed(2)} g Au
              </Badge>
              {isBalanceZero && (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
            </div>
          </div>
        </div>

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