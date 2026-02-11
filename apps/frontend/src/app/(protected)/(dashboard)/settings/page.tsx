"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

// --- Interfaces ---
interface UserSettings {
  id: string;
  userId: string;
  defaultCaixaContaId?: string | null;
  defaultReceitaContaId?: string | null;
  defaultDespesaContaId?: string | null;
  metalStockAccountId?: string | null;
  productionCostAccountId?: string | null;
  metalCreditPayableAccountId?: string | null;
}
interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
}

// --- Schema de Validação do Formulário ---
const settingsFormSchema = z.object({
  defaultCaixaContaId: z.string().nullable().optional(),
  defaultReceitaContaId: z.string().nullable().optional(),
  defaultDespesaContaId: z.string().nullable().optional(),
  metalStockAccountId: z.string().nullable().optional(),
  productionCostAccountId: z.string().nullable().optional(),
  metalCreditPayableAccountId: z.string().nullable().optional(),
});
type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Busca de Dados com React Query ---
  const { data: settings, isLoading: isLoadingSettings } =
    useQuery<UserSettings>({
      queryKey: ["userSettings", user?.id],
      queryFn: async () => {
        const response = await api.get("/settings");
        return response.data;
      },
      enabled: !!user,
    });

  // Busca todas as contas contábeis
  const { data: allAccounts, isLoading: isLoadingAccounts } = useQuery<
    ContaContabil[]
  >({
    queryKey: ["allAccounts"],
    queryFn: async () => {
      const response = await api.get("/contas-contabeis");
      return response.data;
    },
    enabled: !!user,
  });

  // --- Lógica do Formulário ---
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
  });

  // Popula o formulário com os dados buscados assim que eles estiverem disponíveis
  useEffect(() => {
    if (settings) {
      form.reset({
        defaultCaixaContaId: settings.defaultCaixaContaId,
        defaultReceitaContaId: settings.defaultReceitaContaId,
        defaultDespesaContaId: settings.defaultDespesaContaId,
        metalStockAccountId: settings.metalStockAccountId,
        productionCostAccountId: settings.productionCostAccountId,
        metalCreditPayableAccountId: settings.metalCreditPayableAccountId,
      });
    }
  }, [settings, form]);

  // --- Mutação para salvar os dados ---
  const mutation = useMutation({
    mutationFn: (data: SettingsFormValues) => {
      return api.patch("/settings", data);
    },
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Falha ao salvar as configurações."
      );
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    mutation.mutate(data);
  };

  // --- Prepara as opções para os Comboboxes ---
  const caixaOptions: ComboboxOption[] =
    allAccounts
      ?.filter((acc) => acc.tipo === "ATIVO")
      .map((acc) => ({
        value: acc.id,
        label: `${acc.codigo} - ${acc.nome}`,
      })) || [];

  const receitaOptions: ComboboxOption[] =
    allAccounts
      ?.filter((acc) => acc.tipo === "RECEITA")
      .map((acc) => ({
        value: acc.id,
        label: `${acc.codigo} - ${acc.nome}`,
      })) || [];

  const despesaOptions: ComboboxOption[] =
    allAccounts
      ?.filter((acc) => acc.tipo === "DESPESA")
      .map((acc) => ({
        value: acc.id,
        label: `${acc.codigo} - ${acc.nome}`,
      })) || [];

  const metalStockOptions: ComboboxOption[] =
    allAccounts
      ?.filter((acc) => acc.tipo === "ATIVO") // Estoque é um ativo
      .map((acc) => ({
        value: acc.id,
        label: `${acc.codigo} - ${acc.nome}`,
      })) || [];

  const productionCostOptions: ComboboxOption[] =
    allAccounts
      ?.filter((acc) => acc.tipo === "DESPESA" || acc.tipo === "RECEITA") // Custo de produção pode ser despesa ou receita (contrapartida)
      .map((acc) => ({
        value: acc.id,
        label: `${acc.codigo} - ${acc.nome}`,
      })) || [];

  const metalCreditPayableOptions: ComboboxOption[] =
    allAccounts
      ?.filter((acc) => acc.tipo === "PASSIVO") // Dívida com cliente por metal é um passivo
      .map((acc) => ({
        value: acc.id,
        label: `${acc.codigo} - ${acc.nome}`,
      })) || [];

  if (isLoadingSettings || isLoadingAccounts) {
    return <p className="text-center p-10">Carregando configurações...</p>;
  }

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Configurações Gerais</CardTitle>
        <CardDescription>
          Defina as contas contábeis padrão para agilizar os lançamentos
          financeiros.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <Controller
            name="defaultCaixaContaId"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Conta Caixa/Banco Padrão</Label>
                <Combobox
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  options={caixaOptions}
                  placeholder="Selecione a conta de caixa..."
                />
                <p className="text-sm text-muted-foreground">
                  Conta usada para registrar entradas e saídas de dinheiro
                  (pagamentos/recebimentos à vista).
                </p>
              </div>
            )}
          />

          <Controller
            name="defaultReceitaContaId"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Conta de Receita de Vendas Padrão</Label>
                <Combobox
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  options={receitaOptions}
                  placeholder="Selecione a conta de receita..."
                />
                <p className="text-sm text-muted-foreground">
                  Conta usada para registrar as receitas das suas vendas de
                  produtos/serviços.
                </p>
              </div>
            )}
          />

          <Controller
            name="defaultDespesaContaId"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Conta de Despesa Padrão</Label>
                <Combobox
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  options={despesaOptions}
                  placeholder="Selecione a conta de despesa..."
                />
                <p className="text-sm text-muted-foreground">
                  Conta usada para registrar despesas gerais e pagamentos.
                </p>
              </div>
            )}
          />

          {/* Novos campos para contas de metal e custo de produção */}
          <Controller
            name="metalStockAccountId"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Conta de Estoque de Metal Padrão</Label>
                <Combobox
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  options={metalStockOptions}
                  placeholder="Selecione a conta de estoque de metal..."
                />
                <p className="text-sm text-muted-foreground">
                  Conta contábil para registrar o valor do metal recuperado.
                </p>
              </div>
            )}
          />

          <Controller
            name="productionCostAccountId"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Conta de Custo de Produção Padrão</Label>
                <Combobox
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  options={productionCostOptions}
                  placeholder="Selecione a conta de custo de produção..."
                />
                <p className="text-sm text-muted-foreground">
                  Conta contábil para a contrapartida do valor do metal recuperado.
                </p>
              </div>
            )}
          />
          <Controller
            name="metalCreditPayableAccountId"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Conta de Crédito de Metal a Pagar</Label>
                <Combobox
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  options={metalCreditPayableOptions}
                  placeholder="Selecione a conta de crédito de metal a pagar..."
                />
                <p className="text-sm text-muted-foreground">
                  Conta para registrar a dívida com o cliente ao pagar um crédito de metal com dinheiro.
                </p>
              </div>
            )}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}