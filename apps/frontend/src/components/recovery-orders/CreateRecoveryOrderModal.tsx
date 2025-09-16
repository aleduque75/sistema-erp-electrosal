import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import { AnaliseQuimica } from "@/types/analise-quimica";
import { getAnalisesQuimicas } from "@/services/analisesApi";
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';
import { createRecoveryOrder } from "@/services/recoveryOrdersApi";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const createRecoveryOrderSchema = z.object({
  chemicalAnalysisIds: z.array(z.string().uuid()).min(1, "Selecione ao menos uma análise química."),
});

type CreateRecoveryOrderFormData = z.infer<typeof createRecoveryOrderSchema>;

interface CreateRecoveryOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRecoveryOrderModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateRecoveryOrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableAnalyses, setAvailableAnalyses] = useState<AnaliseQuimica[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);

  const form = useForm<CreateRecoveryOrderFormData>({
    resolver: zodResolver(createRecoveryOrderSchema),
    defaultValues: {
      chemicalAnalysisIds: [],
    },
  });

  useEffect(() => {
    const fetchAvailableAnalyses = async () => {
      setIsLoadingAnalyses(true);
      try {
        const fetchedAnalyses = await getAnalisesQuimicas();
        const filtered = fetchedAnalyses.filter(
          (analise) => analise.status === StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO
        );
        setAvailableAnalyses(filtered);
      } catch (error) {
        console.error("Erro ao buscar análises disponíveis:", error);
        toast.error("Erro ao carregar análises disponíveis.");
      } finally {
        setIsLoadingAnalyses(false);
      }
    };

    if (isOpen) {
      fetchAvailableAnalyses();
    }
  }, [isOpen]);

  const onSubmit = async (data: CreateRecoveryOrderFormData) => {
    setIsSubmitting(true);
    try {
      await createRecoveryOrder(data);
      toast.success("Ordem de recuperação criada com sucesso!");
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      toast.error("Erro ao criar ordem de recuperação", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Ordem de Recuperação</DialogTitle>
          <DialogDescription>
            Selecione as análises químicas aprovadas para criar uma nova ordem de recuperação.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="chemicalAnalysisIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Análises Aprovadas</FormLabel>
                    <FormDescription>
                      Selecione as análises que farão parte desta ordem de recuperação.
                    </FormDescription>
                  </div>
                  {isLoadingAnalyses ? (
                    <p>Carregando análises...</p>
                  ) : availableAnalyses.length === 0 ? (
                    <p>Nenhuma análise aprovada disponível.</p>
                  ) : (
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      {availableAnalyses.map((analise) => (
                        <FormField
                          key={analise.id}
                          control={form.control}
                          name="chemicalAnalysisIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={analise.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(analise.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, analise.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== analise.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {analise.numeroAnalise} - {analise.cliente?.name || 'N/A'} ({analise.volumeOuPesoEntrada} {analise.unidadeEntrada})
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </ScrollArea>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || isLoadingAnalyses}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Criar Ordem
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
