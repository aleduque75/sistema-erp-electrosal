"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import {
  ArrowLeft,
  Coins,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const dynamic = "force-dynamic";

const formatGrams = (value?: number) => {
  return (
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value || 0) + " g"
  );
};

function PayClientContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const paramClientId = searchParams?.get("clientId") || null;
  const paramMetalType = searchParams?.get("metalType") || null;
  const paramGrams = searchParams?.get("grams") || null;
  const paramCreditId = searchParams?.get("creditId") || null;

  const [filterByCreditMetal, setFilterByCreditMetal] = useState<boolean>(
    Boolean(paramMetalType)
  );

  const { data: clients, isLoading: isLoadingClients } = useQuery<any[]>({
    queryKey: ["clients"],
    queryFn: async () => (await api.get("/pessoas?role=CLIENT")).data,
  });

  const { data: pureMetalLots, isLoading: isLoadingPureMetalLots } = useQuery<any[]>({
    queryKey: ["pureMetalLots"],
    queryFn: async () => (await api.get("/pure-metal-lots?remainingGramsGt=0")).data,
  });

  const formSchema = z.object({
    clientId: z.string().min(1, "Selecione um cliente."),
    pureMetalLotId: z.string().min(1, "Selecione um lote de metal puro."),
    grams: z.number().min(0.0001, "A quantidade deve ser maior que zero (mínimo 0,0001 g)."),
    notes: z.string().optional(),
    data: z.string().min(1, "Selecione a data do pagamento."),
    metalCreditId: z.string().optional(),
  });

  type FormValues = {
    clientId: string;
    pureMetalLotId: string;
    grams: number;
    notes?: string;
    data: string;
    metalCreditId?: string;
  };

  const defaultGrams = paramGrams ? Number(paramGrams) : 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: paramClientId || "",
      pureMetalLotId: "",
      grams: defaultGrams > 0 ? defaultGrams : 0,
      notes: paramCreditId ? `Quitação/Abatimento referente ao crédito #${paramCreditId.substring(0, 8)}` : "",
      data: new Date().toISOString().split("T")[0],
      metalCreditId: paramCreditId || undefined,
    },
  });

  const watchedLotId = form.watch("pureMetalLotId");
  const watchedGrams = form.watch("grams");

  const selectedLot = useMemo(() => {
    return pureMetalLots?.find((l) => l.id === watchedLotId);
  }, [pureMetalLots, watchedLotId]);

  const selectedClient = useMemo(() => {
    return clients?.find((c) => c.id === form.watch("clientId"));
  }, [clients, form.watch("clientId")]);

  // Filter or prioritize lots
  const availableLots = useMemo(() => {
    if (!pureMetalLots) return [];
    if (paramMetalType && filterByCreditMetal) {
      return pureMetalLots.filter((l) => l.metalType === paramMetalType);
    }
    return pureMetalLots;
  }, [pureMetalLots, paramMetalType, filterByCreditMetal]);

  const lotOptions = useMemo(() => {
    return availableLots.map((l) => {
      const lotLabel = l.lotNumber ? `Lote ${l.lotNumber}` : `ID: ${l.id.substring(0, 8)}`;
      const metal = l.metalType || "METAL";
      const remaining = Number(l.remainingGrams || 0).toFixed(4);
      return {
        value: l.id,
        label: `${lotLabel} • ${metal} (Disp: ${remaining} g) - ${l.description || l.notes || "Sem descrição"}`,
      };
    });
  }, [availableLots]);

  const hasExceededLotBalance = useMemo(() => {
    if (!selectedLot || !watchedGrams) return false;
    return Number(watchedGrams) > Number(selectedLot.remainingGrams || 0);
  }, [selectedLot, watchedGrams]);

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) =>
      api.post("/metal-payments/pay-client", {
        ...data,
        data: new Date(data.data + "T12:00:00").toISOString(),
      }),
    onSuccess: () => {
      toast.success("Pagamento com metal registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["pureMetalLots"] });
      router.push("/creditos-clientes");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Falha ao registrar pagamento de metal.";
      toast.error(message);
    },
  });

  if (isLoadingClients || isLoadingPureMetalLots) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando dados do formulário...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Navegação e Título */}
      <div className="space-y-2">
        <Link
          href="/creditos-clientes"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Créditos de Clientes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Coins className="h-6 w-6 text-primary" />
              Pagar Cliente com Metal
            </h1>
            <p className="text-sm text-muted-foreground">
              Registre a saída de metal puro do estoque físico para abatimento ou quitação do saldo de crédito do cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Cartão de Contexto do Crédito Vinculado */}
      {paramCreditId && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                <Scale className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Crédito Vinculado
                  </span>
                  {paramMetalType && (
                    <Badge variant="outline" className="text-xs font-bold">
                      {paramMetalType}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">
                  Cliente: <span className="font-bold">{selectedClient?.name || paramClientId}</span>
                </p>
                {paramGrams && (
                  <p className="text-xs text-muted-foreground">
                    Saldo disponível no crédito:{" "}
                    <strong className="text-primary font-semibold">
                      {formatGrams(Number(paramGrams))}
                    </strong>
                  </p>
                )}
              </div>
            </div>

            {paramGrams && Number(paramGrams) > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start md:self-center text-xs font-medium border-primary/30 hover:bg-primary/10"
                onClick={() => form.setValue("grams", Number(paramGrams))}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Preencher saldo total ({formatGrams(Number(paramGrams))})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulário Principal */}
      <Card className="shadow-md border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Dados da Operação</CardTitle>
          <CardDescription>
            Informe os dados da entrega física ou baixa no lote de estoque correspondente.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Cliente */}
                <Controller
                  name="clientId"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel className="text-sm font-semibold">Cliente *</FormLabel>
                      <Combobox
                        value={field.value}
                        onChange={field.onChange}
                        options={
                          clients?.map((c) => ({
                            value: c.id,
                            label: c.name,
                          })) || []
                        }
                        placeholder="Selecione o cliente..."
                        searchPlaceholder="Pesquisar cliente..."
                      />
                      {form.formState.errors.clientId && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.clientId.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Data */}
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Data da Operação *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lote de Estoque */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold">
                    Lote de Metal Puro (Estoque) *
                  </FormLabel>
                  {paramMetalType && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setFilterByCreditMetal((prev) => !prev)}
                    >
                      {filterByCreditMetal
                        ? `Mostrando apenas ${paramMetalType} (ver todos)`
                        : `Filtrar por ${paramMetalType}`}
                    </Button>
                  )}
                </div>

                <Controller
                  name="pureMetalLotId"
                  control={form.control}
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      options={lotOptions}
                      placeholder={
                        availableLots.length === 0
                          ? "Nenhum lote com saldo disponível..."
                          : "Selecione o lote de metal..."
                      }
                      searchPlaceholder="Pesquisar lote por número ou descrição..."
                      emptyText="Nenhum lote correspondente encontrado."
                    />
                  )}
                />
                {form.formState.errors.pureMetalLotId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.pureMetalLotId.message}
                  </p>
                )}

                {/* Info do Lote Selecionado */}
                {selectedLot && (
                  <div className="p-3 bg-muted/40 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedLot.metalType}</Badge>
                      <span className="text-muted-foreground">Saldo disponível no lote:</span>
                      <strong className="font-semibold text-foreground">
                        {formatGrams(Number(selectedLot.remainingGrams))}
                      </strong>
                    </div>
                    {hasExceededLotBalance && (
                      <span className="text-destructive font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Saldo insuficiente no lote!
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quantidade a Pagar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="grams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Quantidade a Abater (Gramas) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? "" : Number(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Atalhos Rápidos se vier de um crédito */}
                {paramGrams && Number(paramGrams) > 0 && (
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-muted-foreground">
                      Atalhos de Quantidade
                    </FormLabel>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-xs h-9"
                        onClick={() => form.setValue("grams", Number(paramGrams))}
                      >
                        100% ({formatGrams(Number(paramGrams))})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-9"
                        onClick={() =>
                          form.setValue("grams", Number((Number(paramGrams) / 2).toFixed(4)))
                        }
                      >
                        50% ({formatGrams(Number(paramGrams) / 2)})
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Observações / Justificativa (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Ex: Entrega física realizada no balcão; abatimento referente à análise..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="p-6 bg-muted/20 border-t flex flex-col-reverse sm:flex-row justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/creditos-clientes")}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || hasExceededLotBalance}
                className="gap-2 font-medium"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando Pagamento...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Pagamento com Metal
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

export default function PayClientWithMetalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando formulário...</p>
        </div>
      }
    >
      <PayClientContent />
    </Suspense>
  );
}
