"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Package, CreditCard, Sparkles } from "lucide-react";
import api from "@/lib/api";

const formSchema = z.object({
  metalType: z.enum(["AU", "AG"]),
  transferDate: z.string().min(1, "A data da transferência é obrigatória."),
  notes: z.string().optional(),

  // Ouro (AU)
  grams: z.coerce.number().optional(),
  goldQuoteValue: z.coerce.number().optional(),

  // Prata (AG)
  metalGrams: z.coerce.number().optional(),
  metalQuoteValue: z.coerce.number().optional(),
  totalValueBRL: z.coerce.number().optional(),
  goldEquivalentGrams: z.coerce.number().optional(),
});

type TransferFormValues = z.infer<typeof formSchema>;

interface TransferFromSupplierAccountFormProps {
  supplierMetalAccountId: string;
  onSave: () => void;
  onClose: () => void;
}

export function TransferFromSupplierAccountForm({
  supplierMetalAccountId,
  onSave,
  onClose,
}: TransferFromSupplierAccountFormProps) {
  const router = useRouter();
  const [isLoadingAuQuote, setIsLoadingAuQuote] = useState(false);
  const [isLoadingAgQuote, setIsLoadingAgQuote] = useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      metalType: "AU",
      transferDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      grams: 0,
      goldQuoteValue: undefined,
      metalGrams: 0,
      metalQuoteValue: undefined,
      totalValueBRL: 0,
      goldEquivalentGrams: 0,
    },
  });

  const metalTypeWatch = form.watch("metalType");
  const transferDateWatch = form.watch("transferDate");
  const gramsWatch = form.watch("grams") || 0;
  const goldQuoteWatch = form.watch("goldQuoteValue") || 0;
  const metalGramsWatch = form.watch("metalGrams") || 0;
  const metalQuoteWatch = form.watch("metalQuoteValue") || 0;
  const totalValueBRLWatch = form.watch("totalValueBRL") || 0;

  // Busca cotação de Ouro quando muda a data
  useEffect(() => {
    const fetchGoldQuote = async () => {
      if (!transferDateWatch) return;
      setIsLoadingAuQuote(true);
      try {
        const response = await api.get(
          `/quotations/latest?metal=AU&date=${transferDateWatch}`
        );
        if (response.data?.sellPrice) {
          form.setValue("goldQuoteValue", response.data.sellPrice);
        } else {
          form.setValue("goldQuoteValue", undefined);
          toast.info("Nenhuma cotação de Ouro encontrada para a data. Você pode informá-la manualmente.");
        }
      } catch (error) {
        form.setValue("goldQuoteValue", undefined);
      } finally {
        setIsLoadingAuQuote(false);
      }
    };
    fetchGoldQuote();
  }, [transferDateWatch, form]);

  // Busca cotação de Prata quando muda a data ou quando seleciona Prata
  useEffect(() => {
    const fetchSilverQuote = async () => {
      if (!transferDateWatch || metalTypeWatch !== "AG") return;
      setIsLoadingAgQuote(true);
      try {
        const response = await api.get(
          `/quotations/latest?metal=AG&date=${transferDateWatch}`
        );
        if (response.data?.sellPrice) {
          form.setValue("metalQuoteValue", response.data.sellPrice);
        } else {
          form.setValue("metalQuoteValue", undefined);
          toast.info("Nenhuma cotação de Prata encontrada para a data. Você pode informá-la manualmente.");
        }
      } catch (error) {
        form.setValue("metalQuoteValue", undefined);
      } finally {
        setIsLoadingAgQuote(false);
      }
    };
    fetchSilverQuote();
  }, [transferDateWatch, metalTypeWatch, form]);

  // Recalcula valor total em R$ para Prata automaticamente se metalGrams ou metalQuoteValue mudarem
  useEffect(() => {
    if (metalTypeWatch === "AG" && metalGramsWatch > 0 && metalQuoteWatch > 0) {
      const calculatedBRL = Number((metalGramsWatch * metalQuoteWatch).toFixed(2));
      form.setValue("totalValueBRL", calculatedBRL);
    }
  }, [metalTypeWatch, metalGramsWatch, metalQuoteWatch, form]);

  // Recalcula equivalente em Ouro automaticamente a partir do valor em R$ e da cotação do Ouro
  useEffect(() => {
    if (metalTypeWatch === "AG" && totalValueBRLWatch > 0 && goldQuoteWatch > 0) {
      const calculatedAu = Number((totalValueBRLWatch / goldQuoteWatch).toFixed(4));
      form.setValue("goldEquivalentGrams", calculatedAu);
    } else if (metalTypeWatch === "AG") {
      form.setValue("goldEquivalentGrams", 0);
    }
  }, [metalTypeWatch, totalValueBRLWatch, goldQuoteWatch, form]);

  const onSubmit = async (values: TransferFormValues) => {
    try {
      if (values.metalType === "AU") {
        if (!values.grams || values.grams <= 0) {
          toast.error("Informe uma quantidade de ouro válida.");
          return;
        }
        if (!values.goldQuoteValue || values.goldQuoteValue <= 0) {
          toast.error("Informe a cotação do ouro.");
          return;
        }

        await api.post(
          "/metal-accounts/transfer-from-supplier-account-to-pure-metal-lots",
          {
            supplierMetalAccountId,
            metalType: "AU",
            grams: values.grams,
            notes: values.notes,
            transferDate: values.transferDate ? new Date(values.transferDate) : undefined,
            goldQuoteValue: values.goldQuoteValue,
          }
        );
      } else {
        // PRATA (AG)
        if (!values.metalGrams || values.metalGrams <= 0) {
          toast.error("Informe uma quantidade de prata válida.");
          return;
        }
        if (!values.metalQuoteValue || values.metalQuoteValue <= 0) {
          toast.error("Informe a cotação da prata.");
          return;
        }
        if (!values.goldQuoteValue || values.goldQuoteValue <= 0) {
          toast.error("Informe a cotação do ouro para conversão da conta corrente.");
          return;
        }

        const totalBRL = values.totalValueBRL || (values.metalGrams * values.metalQuoteValue);
        const auEquivalent = values.goldEquivalentGrams || Number((totalBRL / values.goldQuoteValue).toFixed(4));

        await api.post(
          "/metal-accounts/transfer-from-supplier-account-to-pure-metal-lots",
          {
            supplierMetalAccountId,
            metalType: "AG",
            grams: auEquivalent,
            notes: values.notes,
            transferDate: values.transferDate ? new Date(values.transferDate) : undefined,
            metalGrams: values.metalGrams,
            metalQuoteValue: values.metalQuoteValue,
            totalValueBRL: totalBRL,
            goldQuoteValue: values.goldQuoteValue,
            goldEquivalentGrams: auEquivalent,
          }
        );
      }

      toast.success("Transferência realizada com sucesso!");
      form.reset();
      onSave();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao realizar transferência", {
        description: error.response?.data?.message || "Ocorreu um erro desconhecido",
      });
    }
  };

  const calculatedAuTotalBRL = useMemo(() => {
    return (gramsWatch * goldQuoteWatch).toFixed(2);
  }, [gramsWatch, goldQuoteWatch]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Seletor de Metal */}
        <div className="flex flex-col gap-2">
          <FormLabel className="text-sm font-semibold">Tipo de Metal a Transferir</FormLabel>
          <Tabs
            value={metalTypeWatch}
            onValueChange={(val) => form.setValue("metalType", val as "AU" | "AG")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="AU" className="font-semibold">
                Ouro (AU)
              </TabsTrigger>
              <TabsTrigger value="AG" className="font-semibold">
                Prata (AG)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Data da Transferência */}
        <FormField
          control={form.control}
          name="transferDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Transferência</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CAMPOS PARA OURO (AU) */}
        {metalTypeWatch === "AU" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="goldQuoteValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cotação do Ouro (R$/g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isLoadingAuQuote}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {isLoadingAuQuote ? "Buscando cotação..." : "Se vazio, informe manualmente."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Ouro (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {gramsWatch > 0 && goldQuoteWatch > 0 && (
              <Card className="bg-muted/40 border">
                <CardContent className="p-3 text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Valor total estimado:</span>
                  <span className="font-bold text-sm text-foreground">
                    R$ {Number(calculatedAuTotalBRL).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* CAMPOS PARA PRATA (AG) COM CONVERSÃO EM OURO */}
        {metalTypeWatch === "AG" && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                O estoque de metal puro receberá <strong>Prata (Ag)</strong>, enquanto o extrato do fornecedor será debitado na equivalência em <strong>Ouro (Au)</strong> e <strong>R$</strong>.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="metalGrams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Prata (g Ag)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="Ex: 1213.97"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Peso físico da Prata que entrará no lote
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metalQuoteValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cotação da Prata (R$/g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 9.02"
                        disabled={isLoadingAgQuote}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {isLoadingAgQuote ? "Buscando..." : "Cotação de Ag (ex: 9,02)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalValueBRL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 10950.00"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Calculado automaticamente ou ajuste manual
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goldQuoteValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cotação do Ouro (R$/g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 710.00"
                        disabled={isLoadingAuQuote}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Cotação de Au para a conversão (ex: 710)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Card de Resumo da Operação */}
            {metalGramsWatch > 0 && (
              <Card className="border border-primary/30 bg-card shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Resumo do Lançamento
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-2.5 rounded-md bg-muted/60 border flex items-center gap-2.5">
                      <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[11px] text-muted-foreground">Entrada Estoque (Metal Puro)</div>
                        <div className="font-bold text-foreground">
                          {metalGramsWatch.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} g de Prata (Ag)
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-md bg-muted/60 border flex items-center gap-2.5">
                      <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <div className="text-[11px] text-muted-foreground">Débito no Extrato Fornecedor</div>
                        <div className="font-bold text-foreground">
                          {(form.watch("goldEquivalentGrams") || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} g Au
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            (R$ {Number(totalValueBRLWatch).toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Observações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione observações sobre a transferência..."
                  className="resize-none h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isLoadingAuQuote || isLoadingAgQuote}
          >
            {form.formState.isSubmitting ? "Transferindo..." : "Realizar Transferência"}
          </Button>
        </div>
      </form>
    </Form>
  );
}