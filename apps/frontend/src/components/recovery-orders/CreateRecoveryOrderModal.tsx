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
import { AnaliseQuimica } from "../../types/analise-quimica";
import { getAnalisesQuimicas } from "@/services/analisesApi";
import { createRecoveryOrder } from "@/services/recoveryOrdersApi";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TipoMetal } from "@/types/tipo-metal";
import { DatePicker } from "@/components/ui/date-picker";

const createRecoveryOrderSchema = z.object({
  metalType: z.nativeEnum(TipoMetal, { required_error: "Selecione um tipo de metal." }),
  chemicalAnalysisIds: z.array(z.string().uuid()).min(1, "Selecione ao menos uma análise química."),
  dataInicio: z.date().optional(),
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
  const [allAnalyses, setAllAnalyses] = useState<AnaliseQuimica[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnaliseQuimica[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);

  const form = useForm<CreateRecoveryOrderFormData>({
    resolver: zodResolver(createRecoveryOrderSchema),
    defaultValues: {
      chemicalAnalysisIds: [],
      metalType: TipoMetal.AU,
      dataInicio: new Date(),
    },
  });

  const selectedMetalType = form.watch('metalType');
  
  useEffect(() => {
    form.setValue('dataInicio', new Date());
  }, [isOpen, form]);
  
  useEffect(() => {
    const fetchAvailableAnalyses = async () => {
      setIsLoadingAnalyses(true);
      try {
        const fetchedAnalyses = await getAnalisesQuimicas();
        const filtered = fetchedAnalyses.filter(
          (analise) => analise.status === 'APROVADO_PARA_RECUPERACAO'
        );
        setAllAnalyses(filtered);
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

  useEffect(() => {
    const filtered = allAnalyses.filter(analise => analise.metalType === selectedMetalType);
    setFilteredAnalyses(filtered);
    form.setValue('chemicalAnalysisIds', []); // Reset selection when metal type changes
  }, [selectedMetalType, allAnalyses, form]);

  const onSubmit = async (data: CreateRecoveryOrderFormData) => {
    setIsSubmitting(true);
    try {
      await createRecoveryOrder({
        ...data,
        dataInicio: data.dataInicio?.toISOString(), // Convert Date to ISO string for backend
      });
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
              name="metalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Metal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o metal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TipoMetal.AU}>Ouro (AU)</SelectItem>
                      <SelectItem value={TipoMetal.AG}>Prata (AG)</SelectItem>
                      <SelectItem value={TipoMetal.RH}>Ródio (RH)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataInicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Selecione a data de início"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  ) : filteredAnalyses.length === 0 ? (
                    <p>Nenhuma análise aprovada disponível para o metal selecionado.</p>
                  ) : (
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      {filteredAnalyses.map((analise) => (
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
