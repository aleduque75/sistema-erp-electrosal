import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { FormCombobox } from "@/components/ui/FormCombobox";
import api from "@/lib/api";

const createRecoveryOrderSchema = z.object({
  metalType: z.nativeEnum(TipoMetal, { required_error: "Selecione um tipo de metal." }),
  chemicalAnalysisIds: z.array(z.string().uuid()).min(1, "Selecione ao menos uma análise química."),
  dataInicio: z.date().optional(),
  salespersonId: z.string().optional(),
  commissionPercentage: z.coerce.number().min(0).max(100).optional(),
  commissionAmount: z.coerce.number().min(0).optional(),
  rawMaterials: z.array(z.object({
    rawMaterialId: z.string().min(1, "Selecione uma matéria-prima"),
    quantity: z.coerce.number().positive("Quantidade deve ser positiva"),
  })).optional(),
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
  const [salespeople, setSalespeople] = useState<{ id: string; name: string }[]>([]);
  const [rawMaterialsList, setRawMaterialsList] = useState<{ id: string; name: string; unit: string }[]>([]);

  const form = useForm<CreateRecoveryOrderFormData>({
    resolver: zodResolver(createRecoveryOrderSchema),
    defaultValues: {
      chemicalAnalysisIds: [],
      metalType: TipoMetal.AU,
      dataInicio: new Date(),
      salespersonId: "",
      commissionPercentage: 0,
      commissionAmount: 0,
      rawMaterials: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rawMaterials",
  });

  const selectedMetalType = form.watch('metalType');
  
  useEffect(() => {
    form.setValue('dataInicio', new Date());
  }, [isOpen, form]);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingAnalyses(true);
      try {
        const [fetchedAnalyses, salespeopleRes, rawMaterialsRes] = await Promise.all([
          getAnalisesQuimicas(),
          api.get("/pessoas?role=FUNCIONARIO"),
          api.get("/raw-materials")
        ]);
        
        const filtered = fetchedAnalyses.filter(
          (analise) => analise.status === 'APROVADO_PARA_RECUPERACAO'
        );
        setAllAnalyses(filtered);
        setSalespeople(salespeopleRes.data);
        setRawMaterialsList(rawMaterialsRes.data);
      } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
        toast.error("Erro ao carregar dados iniciais.");
      } finally {
        setIsLoadingAnalyses(false);
      }
    };

    if (isOpen) {
      fetchInitialData();
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
        salespersonId: data.salespersonId || undefined,
        rawMaterials: data.rawMaterials?.filter(rm => rm.rawMaterialId && rm.quantity > 0),
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Ordem de Recuperação</DialogTitle>
          <DialogDescription>
            Selecione as análises, configure a comissão e adicione matérias-primas, se necessário.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="border rounded-md p-4 space-y-4">
              <h3 className="font-medium text-sm border-b pb-2">Comissão (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="salespersonId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Vendedor</FormLabel>
                      <FormControl>
                        <FormCombobox
                          items={salespeople.map(s => ({ value: s.id, label: s.name }))}
                          value={field.value || null}
                          onSelect={field.onChange}
                          triggerPlaceholder="Selecione..."
                          searchPlaceholder="Buscar vendedor..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commissionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comissão (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commissionAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Fixo (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-medium text-sm">Matérias-Primas do Estoque</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ rawMaterialId: "", quantity: 0 })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              
              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  Nenhuma matéria-prima adicionada para esta ordem.
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3">
                    <FormField
                      control={form.control}
                      name={`rawMaterials.${index}.rawMaterialId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className={index > 0 ? "sr-only" : ""}>Item</FormLabel>
                          <FormControl>
                            <FormCombobox
                              items={rawMaterialsList.map(rm => ({ value: rm.id, label: `${rm.name} (${rm.unit})` }))}
                              value={field.value}
                              onSelect={field.onChange}
                              triggerPlaceholder="Selecione..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rawMaterials.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormLabel className={index > 0 ? "sr-only" : ""}>Qtd</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="chemicalAnalysisIds"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">Análises Aprovadas</FormLabel>
                    <FormDescription>
                      Selecione as análises que farão parte desta ordem de recuperação.
                    </FormDescription>
                  </div>
                  {isLoadingAnalyses ? (
                    <p>Carregando análises...</p>
                  ) : filteredAnalyses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhuma análise aprovada disponível para o metal selecionado.</p>
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
                                className="flex flex-row items-start space-x-3 space-y-0 py-1"
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
                                <FormLabel className="font-normal cursor-pointer">
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
