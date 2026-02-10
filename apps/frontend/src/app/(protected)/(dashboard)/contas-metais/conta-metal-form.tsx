// apps/frontend/src/app/(dashboard)/contas-metais/conta-metal-form.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Importação correta: Usa o nome ContaMetalType
import { ContaMetalType } from "@sistema-erp-electrosal/core";

// 1. Definir o enum TipoMetal no frontend para validação (mantido, mas pode ser importado do core)
enum TipoMetalFrontend {
  AU = "AU",
  AG = "AG",
  RH = "RH",
}

// 2. Definir o array de strings literais para o Zod (resolvendo o problema de runtime)
const CONTA_METAL_TYPES = [
  "CLIENTE",
  "FORNECEDOR",
  "INTERNA",
  "EMPRESTIMO",
] as const; // Baseado no seu schema.prisma (assumindo esses valores)

const formSchema = z.object({
  name: z.string().min(3, "O nome da conta deve ter pelo menos 3 caracteres."),
  metalType: z.nativeEnum(TipoMetalFrontend, {
    errorMap: () => ({ message: "Tipo de metal inválido." }),
  }),
  // 3. CORRIGIDO: Usando ContaMetalType e z.enum
  type: z
    .enum(CONTA_METAL_TYPES, {
      // Usando z.enum para resolver o problema de transpilação
      errorMap: () => ({ message: "Tipo de conta inválido." }),
    })
    .default("INTERNA"), // Default deve ser uma string literal

  initialBalance: z.coerce
    .number()
    .min(0, "O saldo inicial não pode ser negativo.")
    .default(0),
});

type ContaMetalFormValues = z.infer<typeof formSchema>;

interface ContaMetalFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export function ContaMetalForm({ onSave, onCancel }: ContaMetalFormProps) {
  // 4. CORRIGIDO: O defaultValues deve usar o Enum correto ou a string literal
  const form = useForm<ContaMetalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      metalType: TipoMetalFrontend.AU, // Default para Ouro
      type: "INTERNA", // Usa o Enum importado, agora que Zod aceita
      initialBalance: 0,
    },
  });

  const onSubmit = async (data: ContaMetalFormValues) => {
    try {
      // Garante que o valor inicial seja um número antes de enviar
      const dataToSend = {
        ...data,
        initialBalance: data.initialBalance ?? 0,
      };

      await api.post("/contas-metais", dataToSend);
      toast.success("Conta de metal criada com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Ocorreu um erro ao criar a conta de metal."
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Conta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Estoque de Ouro Puro" {...field} />
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
                    <SelectValue placeholder="Selecione o tipo de metal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TipoMetalFrontend).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Conta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* 5. CORRIGIDO: Mapeia os valores do Enum (agora com ContaMetalType) */}
                  {Object.values(ContaMetalType)
                    .filter((type): type is string => typeof type === "string")
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="initialBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial (g)</FormLabel>
              <FormControl>
                {/* 6. CORRIGIDO: Garante que o input lide com valores numéricos */}
                <Input
                  type="number"
                  step="0.0001"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Criar Conta"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
