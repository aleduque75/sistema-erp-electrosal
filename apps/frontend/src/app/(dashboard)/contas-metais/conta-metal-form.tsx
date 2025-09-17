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

// Definir o enum TipoMetal no frontend para validação
enum TipoMetalFrontend {
  AU = "AU",
  AG = "AG",
  RH = "RH",
}

const formSchema = z.object({
  name: z.string().min(3, "O nome da conta deve ter pelo menos 3 caracteres."),
  metalType: z.nativeEnum(TipoMetalFrontend, {
    errorMap: () => ({ message: "Tipo de metal inválido." }),
  }),
  initialBalance: z.coerce.number().min(0, "O saldo inicial não pode ser negativo.").optional(),
});

type ContaMetalFormValues = z.infer<typeof formSchema>;

interface ContaMetalFormProps {
  onSave: () => void; // Função para ser chamada após salvar
  onCancel: () => void; // Função para ser chamada ao cancelar
}

export function ContaMetalForm({ onSave, onCancel }: ContaMetalFormProps) {
  const form = useForm<ContaMetalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      metalType: TipoMetalFrontend.AU, // Default para Ouro
      initialBalance: 0,
    },
  });

  const onSubmit = async (data: ContaMetalFormValues) => {
    try {
      await api.post("/contas-metais", data);
      toast.success("Conta de metal criada com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro ao criar a conta de metal.");
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
          name="initialBalance" // Corrigido para initialBalance
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial (g)</FormLabel>
              <FormControl>
                <Input type="number" step="0.0001" {...field} />
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
