"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import api from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TipoMetal } from "@/types/tipo-metal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// --- Interfaces ---
interface Client {
  id: string;
  name: string;
}

interface PureMetalLot {
  id: string;
  lotNumber?: string | null;
  metalType: TipoMetal;
  remainingGrams: number;
}

// --- Schema de Validação do Formulário ---
const formSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  pureMetalLotId: z.string().min(1, "Selecione um lote de metal puro."),
  grams: z.coerce.number().min(0.01, "A quantidade em gramas deve ser maior que zero."),
  notes: z.string().optional(),
  data: z.date({ required_error: "A data é obrigatória." }),
});

type PayClientWithMetalFormValues = z.infer<typeof formSchema>;

export default function PayClientWithMetalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- Busca de Dados com React Query ---
  // Busca todos os clientes
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({    queryKey: ["clients"],
    queryFn: async () => {
      const response = await api.get("/pessoas?role=CLIENT");
      return response.data;
    },
  });

  // Busca lotes de metal puro disponíveis
  const { data: pureMetalLots, isLoading: isLoadingPureMetalLots } = useQuery<PureMetalLot[]>({
    queryKey: ["pureMetalLots"],
    queryFn: async () => {
      const response = await api.get("/pure-metal-lots?remainingGramsGt=0"); // Apenas lotes com saldo
      return response.data;
    },
  });

  // --- Lógica do Formulário ---
  const form = useForm<PayClientWithMetalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      pureMetalLotId: "",
      grams: 0,
      notes: "",
      data: new Date(),
    },
  });

  const selectedLotId = form.watch("pureMetalLotId");
  const selectedLot = pureMetalLots?.find(lot => lot.id === selectedLotId);

  // --- Mutação para salvar os dados ---
  const mutation = useMutation({
    mutationFn: (data: PayClientWithMetalFormValues) => {
      return api.post("/metal-payments/pay-client", data);
    },
    onSuccess: () => {
      toast.success("Pagamento em metal ao cliente registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["pureMetalLots"] }); // Invalida o cache dos lotes
      router.push("/pure-metal-lots"); // Redireciona para a listagem de lotes
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Falha ao registrar pagamento em metal."
      );
    },
  });

  const onSubmit = (data: PayClientWithMetalFormValues) => {
    if (selectedLot && data.grams > selectedLot.remainingGrams) {
      form.setError("grams", { message: "Quantidade em gramas excede o saldo disponível no lote." });
      return;
    }
    mutation.mutate(data);
  };

  // --- Prepara as opções para os Comboboxes ---
  const clientOptions: ComboboxOption[] =
    clients?.map((client) => ({
      value: client.id,
      label: client.name,
    })) || [];

  const pureMetalLotOptions: ComboboxOption[] =
    pureMetalLots?.map((lot) => ({
      value: lot.id,
      label: `${lot.lotNumber || lot.id} (${lot.metalType} - ${lot.remainingGrams.toFixed(2)}g)`,
    })) || [];

  if (isLoadingClients || isLoadingPureMetalLots) {
    return <p className="text-center p-10">Carregando dados...</p>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/pure-metal-lots">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Pagar Cliente com Metal</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Registrar Pagamento em Metal</CardTitle>
          <CardDescription>
            Utilize esta tela para registrar o pagamento a um cliente utilizando metal do estoque.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <Controller
                name="clientId"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <FormLabel>Cliente</FormLabel>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={clientOptions}
                    placeholder="Selecione o cliente..."
                  />
                  <FormMessage>{form.formState.errors.clientId?.message}</FormMessage>
                </div>
              )}
            />

            <Controller
              name="pureMetalLotId"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <FormLabel>Lote de Metal Puro</FormLabel>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={pureMetalLotOptions}
                    placeholder="Selecione o lote de metal..."
                  />
                  <FormMessage>{form.formState.errors.pureMetalLotId?.message}</FormMessage>
                  {selectedLot && (
                    <p className="text-sm text-muted-foreground">
                      Saldo disponível: {selectedLot.remainingGrams.toFixed(2)}g ({selectedLot.metalType})
                    </p>
                  )}
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="grams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade em Gramas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Transação</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Registrando Pagamento..." : "Registrar Pagamento"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
    </div>
  );
}
