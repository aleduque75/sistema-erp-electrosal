'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, FlaskConical, Scale, Info, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Definir o enum localmente para evitar problemas de importação do Prisma Client no frontend
enum ReactionLeftoverType {
  BASKET = 'BASKET',
  DISTILLATE = 'DISTILLATE',
}

const formSchema = z.object({
  reactionDate: z.date({ required_error: 'A data da reação é obrigatória.' }),
  batchNumber: z.string().optional(),
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

  const metalSymbol = reactionDetails?.metalType || 'Au';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reactionDate: new Date(),
      outputProductGrams: 0,
      outputBasketLeftoverGrams: 0,
      outputDistillateLeftoverGrams: 0,
    }
  });

  const { setValue, getValues } = form;

  const outputProductGrams = form.watch('outputProductGrams');
  const outputBasketLeftoverGrams = form.watch('outputBasketLeftoverGrams');
  const outputDistillateLeftoverGrams = form.watch('outputDistillateLeftoverGrams');

  const metalInProduct = useMemo(() => {
    const metalContent = reactionDetails?.outputProduct?.goldValue || 0;
    const quantity = Number(outputProductGrams);
    return isNaN(quantity) ? 0 : quantity * metalContent;
  }, [outputProductGrams, reactionDetails]);

  // Efeito para avisar sobre teor de metal zerado
  useEffect(() => {
    const metalContent = reactionDetails?.outputProduct?.goldValue || 0;
    if (reactionDetails && metalContent === 0 && Number(outputProductGrams) > 0) {
      toast.warning(`Teor de ${metalSymbol} do produto é 0%`, { description: `O cálculo de ${metalSymbol} no produto final está zerado. Verifique o cadastro do produto.` });
    }
  }, [outputProductGrams, reactionDetails, metalSymbol]);

  const totalOutputMetal = useMemo(() => {
    return metalInProduct + (Number(outputBasketLeftoverGrams) || 0) + (Number(outputDistillateLeftoverGrams) || 0);
  }, [metalInProduct, outputBasketLeftoverGrams, outputDistillateLeftoverGrams]);

  const balance = useMemo(() => {
    return auUsedGrams - totalOutputMetal;
  }, [auUsedGrams, totalOutputMetal]);

  const isBalanceZero = useMemo(() => Math.abs(balance) < 0.001, [balance]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        reactionDate: format(values.reactionDate, 'yyyy-MM-dd'),
      };
      await api.patch(`/chemical-reactions/${reactionId}/complete-production`, payload);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> Data e Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField name="reactionDate" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Finalização</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} 
                      onChange={(e) => field.onChange(new Date(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="batchNumber" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Lote (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Deixe vazio para gerar automático" {...field} /></FormControl>
                  <FormDescription>Se vazio, o sistema gerará o próximo número sequencial.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4" /> Resultados da Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg border flex items-start gap-2 mb-2">
                <Info className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  O produto de saída configurado é: <span className="font-semibold text-foreground">{reactionDetails?.outputProduct?.name || 'Carregando...'}</span> 
                  (Teor: {((reactionDetails?.outputProduct?.goldValue || 0) * 100).toFixed(2)}% {metalSymbol})
                </div>
              </div>
              <FormField name="outputProductGrams" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Gramas Produzidas (Peso Bruto do Sal)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="text-xs font-medium text-right text-muted-foreground">
                Equivale a: <span className="text-foreground">{metalInProduct.toFixed(4)} g {metalSymbol} Puro</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" /> Sobras de Metal Puro
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="outputBasketLeftoverGrams" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Sobra de Cesto (g {metalSymbol} Puro)</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="outputDistillateLeftoverGrams" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Sobra de Destilado (g {metalSymbol} Puro)</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card className={cn("border-2 transition-all", isBalanceZero ? "border-green-500/50 bg-green-50/10" : "border-destructive/50 bg-destructive/5")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>Resumo de Balanço de Metal</span>
              {isBalanceZero && <CheckCircle2 className="h-6 w-6 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4 italic">Carregando detalhes do balanço...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border shadow-sm">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Entrada</span>
                  <span className="text-2xl font-bold">{Number(auUsedGrams).toFixed(4)} g</span>
                  <span className="text-[10px] text-muted-foreground">{metalSymbol} total utilizado</span>
                </div>
                
                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-6 w-6 hidden md:block" />
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border shadow-sm">
                   <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Saída Total</span>
                   <span className="text-2xl font-bold">{totalOutputMetal.toFixed(4)} g</span>
                   <span className="text-[10px] text-muted-foreground">Produto + Sobras</span>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex flex-col items-center">
              <div className="text-sm font-medium mb-1">Saldo Remanescente (Diferença)</div>
              <Badge variant={isBalanceZero ? "default" : "destructive"} className="text-xl py-2 px-6 font-mono">
                {balance > 0 ? "+" : ""}{balance.toFixed(4)} g {metalSymbol}
              </Badge>
              {!isBalanceZero && (
                <p className="text-xs text-destructive mt-2 font-semibold">
                  O saldo deve ser zero para completar a produção. Ajuste o peso do produto ou sobras.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !isBalanceZero} className="px-8">
            {form.formState.isSubmitting ? 'Finalizando...' : 'Finalizar Produção'}
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
        <Button size="lg" className="w-full h-12 text-lg font-semibold shadow-md hover:shadow-lg transition-all">
          <CheckCircle2 className="mr-2 h-5 w-5" /> Completar Etapa de Produção
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Finalizar Produção</DialogTitle>
          <DialogDescription>
            Registre as quantidades finais produzidas e sobras para atualizar o estoque de sais e o balanço de metal.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <CompleteProductionStepForm reactionId={reactionId} auUsedGrams={auUsedGrams} setIsOpen={setIsOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}