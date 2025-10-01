"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { MetalLotSelectionModal } from "./metal-lot-selection-modal";

const formSchema = z.object({
  notes: z.string().optional(),
  sourceLots: z // Renomeado de inputMetalLots para sourceLots
    .array(
      z.object({
        pureMetalLotId: z.string().min(1, "Selecione um lote de metal."), // Renomeado de lotId para pureMetalLotId
        gramsToUse: z.coerce.number().min(0.001, "A quantidade deve ser maior que zero."), // Renomeado de quantity para gramsToUse
      })
    )
    .min(1, "Adicione pelo menos um lote de metal."),
  // inputRawMaterialGrams, inputBasketLeftoverGrams, inputDistillateLeftoverGrams removidos
  outputProductGroupId: z.string().min(1, "Selecione o grupo de produto de saída."), // Alterado para ProductGroup
  batchNumber: z.string().optional(), // Novo campo para batchNumber manual
});

type NewReactionFormValues = z.infer<typeof formSchema>;

interface MetalLot {
  id: string;
  remainingGrams: number;
  sourceType: string;
  sourceId: string;
  notes?: string;
}

interface ProductGroup {
  id: string;
  name: string;
  isReactionProductGroup: boolean;
  products: { id: string; name: string; goldValue?: number }[]; // Incluir produtos para derivar o goldValue
}

export function NewReactionForm() {
  const router = useRouter();
  const [isMetalLotModalOpen, setIsMetalLotModalOpen] = useState(false);

  const form = useForm<NewReactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      sourceLots: [], // Renomeado
      // inputRawMaterialGrams, inputBasketLeftoverGrams, inputDistillateLeftoverGrams removidos
      outputProductGroupId: "",
      batchNumber: "", // Default vazio
    },
  });

  const {
    fields: sourceLotFields, // Renomeado de inputMetalLotFields para sourceLotFields
    append: appendSourceLot,
    remove: removeSourceLot,
  } = useFieldArray({
    control: form.control,
    name: "sourceLots", // Renomeado
  });

  const { data: metalLots, isLoading: isLoadingMetalLots } = useQuery<MetalLot[]>({
    queryKey: ["metalLots"],
    queryFn: async () => {
      const response = await api.get("/pure-metal-lots?remainingGramsGt=0");
      return response.data;
    },
  });

  const { data: productGroups, isLoading: isLoadingProductGroups } = useQuery<ProductGroup[]>({
    queryKey: ["productGroups"],
    queryFn: async () => {
      const response = await api.get("/product-groups");
      console.log("Fetched productGroups:", response.data);
      return response.data.filter((pg: ProductGroup) => pg.isReactionProductGroup);
    },
  });

  const selectedOutputProductGroupId = form.watch("outputProductGroupId");
  const selectedOutputProductGroup = useMemo(() => {
    return productGroups?.find(pg => pg.id === selectedOutputProductGroupId);
  }, [productGroups, selectedOutputProductGroupId]);

  const selectedOutputProduct = useMemo(() => {
    return selectedOutputProductGroup?.products?.[0];
  }, [selectedOutputProductGroup]);

  useEffect(() => {
    if (productGroups && productGroups.length > 0 && !selectedOutputProductGroupId) {
      form.setValue("outputProductGroupId", productGroups[0].id);
    }
  }, [productGroups, selectedOutputProductGroupId, form]);

  const handleSelectMetalLots = (selected: { lotId: string; quantity: number }[]) => {
    // Mapear para o formato esperado pelo backend (pureMetalLotId, gramsToUse)
    const mappedSelectedLots = selected.map(lot => ({
      pureMetalLotId: lot.lotId,
      gramsToUse: lot.quantity,
    }));
    form.setValue("sourceLots", mappedSelectedLots);
    setIsMetalLotModalOpen(false);
  };

  const onSubmit = async (values: NewReactionFormValues) => {
    if (!selectedOutputProduct) {
      toast.error("Produto de saída (Sal 68%) não encontrado para o grupo selecionado.");
      return;
    }

    try {
      await api.post("/chemical-reactions", {
        notes: values.notes,
        outputProductId: selectedOutputProduct.id,
        sourceLots: values.sourceLots,
        batchNumber: values.batchNumber, // Envia o batchNumber manual, se houver
      });
      toast.success("Reação química iniciada com sucesso!");
      router.push("/producao/reacoes-quimicas");
    } catch (error: any) {
      toast.error("Erro ao iniciar reação química", {
        description: error.response?.data?.message || "Ocorreu um erro desconhecido",
      });
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Iniciar Nova Reação Química</CardTitle>
        <CardDescription>
          Preencha os detalhes dos insumos e produtos resultantes da reação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção de Insumos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Insumos (Entrada de Ouro)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sourceLotFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`sourceLots.${index}.pureMetalLotId`}
                      render={({ field: lotField }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Lote de Metal</FormLabel>
                          <Select
                            onValueChange={lotField.onChange}
                            defaultValue={lotField.value}
                            disabled={true}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Lote selecionado..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Conteúdo não será usado, pois a seleção é via modal */}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sourceLots.${index}.gramsToUse`}
                      render={({ field: quantityField }) => (
                        <FormItem className="w-32">
                          <FormLabel>Quantidade (g Au)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.000"
                              {...quantityField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSourceLot(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Dialog open={isMetalLotModalOpen} onOpenChange={setIsMetalLotModalOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lotes de Metal
                    </Button>
                  </DialogTrigger>
                  <MetalLotSelectionModal
                    onSelectLots={handleSelectMetalLots}
                    onClose={() => setIsMetalLotModalOpen(false)}
                    existingSelectedLotIds={form.watch("sourceLots").map(f => f.pureMetalLotId)}
                  />
                </Dialog>

                <Separator />

                <FormField
                  control={form.control}
                  name="inputRawMaterialGrams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matéria-Prima (g)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" placeholder="0.000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inputBasketLeftoverGrams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobra de Cesto (g Au)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" placeholder="0.000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inputDistillateLeftoverGrams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobra de Destilado (g Au)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" placeholder="0.000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seção de Produtos Resultantes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produtos Resultantes (Saída de Ouro)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="outputProductGroupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo de Produto de Saída</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingProductGroups}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grupo de produto..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProductGroups ? (
                            <SelectItem value="loading" disabled>
                              Carregando grupos de produtos...
                            </SelectItem>
                          ) : (
                            productGroups?.map((pg) => (
                              <SelectItem key={pg.id} value={pg.id}>
                                {pg.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Lote (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1194" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre a reação química..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting || sourceLotFields.length === 0 || !selectedOutputProductGroupId}>
              {form.formState.isSubmitting ? "Iniciando Reação..." : "Iniciar Reação"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}