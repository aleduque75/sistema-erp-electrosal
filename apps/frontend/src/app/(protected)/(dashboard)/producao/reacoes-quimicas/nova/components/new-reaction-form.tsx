// apps/frontend/src/app/(dashboard)/producao/reacoes-quimicas/nova/components/new-reaction-form.tsx

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
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MetalLotSelectionModal } from "./metal-lot-selection-modal";
import { TipoMetal } from "@/types/tipo-metal";
import { FormCombobox } from "@/components/ui/FormCombobox";

// ZOD SCHEMA for the creation step
const formSchema = z.object({
  reactionDate: z.string().min(1, "Data da reação é obrigatória."),
  metalType: z.nativeEnum(TipoMetal, { required_error: "Selecione um tipo de metal." }),
  notes: z.string().optional(),
  sourceLots: z
    .array(
      z.object({
        pureMetalLotId: z.string().min(1, "Selecione um lote de metal."),
        gramsToUse: z.coerce
          .number()
          .min(0.001, "A quantidade deve ser maior que zero."),
      })
    )
    .min(1, "Adicione pelo menos um lote de metal."),
  outputProductGroupId: z
    .string()
    .min(1, "Selecione o grupo de produto de saída."),
  batchNumber: z.string().optional(),
  rawMaterials: z.array(z.object({
    rawMaterialId: z.string().min(1, "Selecione uma matéria-prima"),
    quantity: z.coerce.number().positive("Quantidade deve ser positiva"),
  })).optional(),
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
  products: { id: string; name: string; goldValue?: number }[];
}

export function NewReactionForm() {
  const router = useRouter();
  const [isMetalLotModalOpen, setIsMetalLotModalOpen] = useState(false);
  const [rawMaterialsList, setRawMaterialsList] = useState<{ id: string; name: string; unit: string }[]>([]);

  const form = useForm<NewReactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reactionDate: new Date().toISOString().split("T")[0],
      metalType: TipoMetal.AU,
      notes: "",
      sourceLots: [],
      outputProductGroupId: "",
      batchNumber: "",
      rawMaterials: [],
    },
  });

  const {
    fields: sourceLotFields,
    remove: removeSourceLot,
  } = useFieldArray({
    control: form.control,
    name: "sourceLots",
  });

  const { fields: rawMaterialFields, append: appendRawMaterial, remove: removeRawMaterial } = useFieldArray({
    control: form.control,
    name: "rawMaterials",
  });

  const { data: productGroups, isLoading: isLoadingProductGroups } = useQuery<
    ProductGroup[]
  >({ 
    queryKey: ["productGroups"],
    queryFn: async () => {
      const response = await api.get("/product-groups");
      return response.data.filter(
        (pg: ProductGroup) => pg.isReactionProductGroup
      );
    },
  });

  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        const response = await api.get("/raw-materials");
        setRawMaterialsList(response.data);
      } catch (error) {
        console.error("Erro ao buscar matérias-primas:", error);
      }
    };
    fetchRawMaterials();
  }, []);

  const selectedOutputProductGroupId = form.watch("outputProductGroupId");
  const selectedMetalType = form.watch("metalType");
  const sourceLots = form.watch("sourceLots");
  const totalGramsToUse = useMemo(() => {
    return sourceLots.reduce((acc, lot) => acc + (lot.gramsToUse || 0), 0);
  }, [sourceLots]);
  
  const selectedOutputProduct = useMemo(() => {
    const group = productGroups?.find((pg) => pg.id === selectedOutputProductGroupId);
    return group?.products?.[0];
  }, [productGroups, selectedOutputProductGroupId]);

  useEffect(() => {
    if (
      productGroups &&
      productGroups.length > 0 &&
      !selectedOutputProductGroupId
    ) {
      form.setValue("outputProductGroupId", productGroups[0].id);
    }
  }, [productGroups, selectedOutputProductGroupId, form]);

  const handleSelectMetalLots = (
    selected: { lotId: string; quantity: number }[]
  ) => {
    const mappedSelectedLots = selected.map((lot) => ({
      pureMetalLotId: lot.lotId,
      gramsToUse: lot.quantity,
    }));
    form.setValue("sourceLots", mappedSelectedLots);
    setIsMetalLotModalOpen(false);
  };

  const onSubmit = async (values: NewReactionFormValues) => {
    if (!selectedOutputProduct) {
      toast.error(
        "Produto de saída não encontrado para o grupo selecionado."
      );
      return;
    }

    try {
      const { outputProductGroupId, ...restOfValues } = values;
      const payload = {
        ...restOfValues,
        reactionDate: new Date(values.reactionDate).toISOString(),
        outputProductId: selectedOutputProduct.id,
      };

      await api.post("/chemical-reactions", payload);
      toast.success("Reação química iniciada com sucesso!");
      router.push("/producao/reacoes-quimicas");
    } catch (error: any) {
      toast.error("Erro ao iniciar reação química", {
        description:
          error.response?.data?.message || "Ocorreu um erro desconhecido",
      });
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Iniciar Nova Reação Química</CardTitle>
        <CardDescription>
          Selecione os insumos e o produto final para iniciar a reação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Reação</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

            {/* Seção de Insumos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Insumos (Entrada de Metal) - Total: {totalGramsToUse.toFixed(3)}g
                </CardTitle>
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
                          <FormLabel>Quantidade (g)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.000"
                              {...quantityField}
                              onChange={(e) =>
                                quantityField.onChange(
                                  parseFloat(e.target.value) || 0
                                )
                              }
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
                <Dialog
                  open={isMetalLotModalOpen}
                  onOpenChange={setIsMetalLotModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lotes de
                      Metal
                    </Button>
                  </DialogTrigger>
                  <MetalLotSelectionModal
                    metalType={selectedMetalType}
                    onSelectLots={handleSelectMetalLots}
                    onClose={() => setIsMetalLotModalOpen(false)}
                    existingSelectedLotIds={form
                      .watch("sourceLots")
                      .map((f) => f.pureMetalLotId)}
                  />
                </Dialog>
              </CardContent>
            </Card>

            {/* Seção de Matérias-Primas do Estoque */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Matérias-Primas do Estoque</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => appendRawMaterial({ rawMaterialId: "", quantity: 0 })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Insumo
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {rawMaterialFields.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center">
                    Nenhum insumo adicional do estoque adicionado.
                  </p>
                )}
                {rawMaterialFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`rawMaterials.${index}.rawMaterialId`}
                      render={({ field: rmField }) => (
                        <FormItem className="flex-1">
                          <FormLabel className={index > 0 ? "sr-only" : ""}>Item</FormLabel>
                          <FormControl>
                            <FormCombobox
                              items={rawMaterialsList.map(rm => ({ value: rm.id, label: `${rm.name} (${rm.unit})` }))}
                              value={rmField.value}
                              onSelect={rmField.onChange}
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
                      render={({ field: quantityField }) => (
                        <FormItem className="w-32">
                          <FormLabel className={index > 0 ? "sr-only" : ""}>Quantidade</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.000"
                              {...quantityField}
                              onChange={(e) =>
                                quantityField.onChange(
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRawMaterial(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Seção de Produto Pretendido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Produto Final Pretendido
                </CardTitle>
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
                              Carregando grupos...
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
                      <FormLabel>Número do Lote de Produção (Opcional)</FormLabel>
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

            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                sourceLotFields.length === 0 ||
                !selectedOutputProductGroupId
              }
            >
              {form.formState.isSubmitting
                ? "Iniciando Reação..."
                : "Iniciar Reação"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
