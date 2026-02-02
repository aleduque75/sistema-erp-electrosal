"use client";

import { useState, useEffect, Suspense } from "react"; // CORREÇÃO: Importado Suspense
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
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

export const dynamic = "force-dynamic"; // CORREÇÃO: Força dinâmica

// --- Componente de Conteúdo (onde o useSearchParams vive) ---
function PayClientContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const paramClientId = searchParams.get("clientId");
  const paramMetalType = searchParams.get("metalType");
  const paramGrams = searchParams.get("grams");

  const { data: clients, isLoading: isLoadingClients } = useQuery<any[]>({
    queryKey: ["clients"],
    queryFn: async () => (await api.get("/pessoas?role=CLIENT")).data,
  });

  const { data: pureMetalLots, isLoading: isLoadingPureMetalLots } = useQuery<
    any[]
  >({
    queryKey: ["pureMetalLots"],
    queryFn: async () =>
      (await api.get("/pure-metal-lots?remainingGramsGt=0")).data,
  });

  const formSchema = z.object({
    clientId: z.string().min(1, "Selecione um cliente."),
    pureMetalLotId: z.string().min(1, "Selecione um lote."),
    grams: z.coerce.number().min(0.01),
    notes: z.string().optional(),
    data: z.string().min(1),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: paramClientId || "",
      pureMetalLotId: "",
      grams: paramGrams ? Number(paramGrams) : 0,
      notes: "",
      data: new Date().toISOString().split("T")[0],
    },
  });

  const selectedLot = pureMetalLots?.find(
    (l) => l.id === form.watch("pureMetalLotId"),
  );

  const mutation = useMutation({
    mutationFn: (data: any) =>
      api.post("/metal-payments/pay-client", {
        ...data,
        data: new Date(data.data + "T12:00:00").toISOString(),
      }),
    onSuccess: () => {
      toast.success("Pagamento registrado!");
      router.push("/creditos-clientes");
    },
  });

  if (isLoadingClients || isLoadingPureMetalLots)
    return <p className="text-center p-10">Carregando...</p>;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar Pagamento</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))}>
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
                    options={
                      clients?.map((c) => ({ value: c.id, label: c.name })) ||
                      []
                    }
                  />
                </div>
              )}
            />
            <Controller
              name="pureMetalLotId"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <FormLabel>Lote</FormLabel>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={
                      pureMetalLots?.map((l) => ({
                        value: l.id,
                        label: `${l.lotNumber || l.id} (${l.metalType})`,
                      })) || []
                    }
                  />
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="grams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gramas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.0001" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={mutation.isPending}>
              Registrar
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// --- Export principal com Suspense ---
export default function PayClientWithMetalPage() {
  return (
    <div className="space-y-4 p-4 md:p-8">
      <Suspense fallback={<p>Carregando formulário...</p>}>
        <PayClientContent />
      </Suspense>
    </div>
  );
}
