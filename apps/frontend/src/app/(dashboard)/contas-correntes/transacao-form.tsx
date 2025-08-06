// Possível caminho: apps/frontend/src/app/(dashboard)/contas-correntes/create/transacao-form.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useEffect, useState, useMemo } from "react";

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
import { Combobox } from "@/components/ui/combobox";

const formSchema = z.object({
  descricao: z.string().min(3, "A descrição é obrigatória."),
  valor: z.coerce.number().positive("O valor deve ser maior que zero."),
  tipo: z.enum(["CREDITO", "DEBITO"]),
  contaContabilId: z.string({
    required_error: "Selecione uma conta contábil.",
  }),
  dataHora: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (AAAA-MM-DD)."),
});

type FormValues = z.infer<typeof formSchema>;
interface TransacaoFormProps {
  contaCorrenteId: string;
  onSave: () => void;
}
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}

export function TransacaoForm({ contaCorrenteId, onSave }: TransacaoFormProps) {
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataHora: new Date().toISOString().split("T")[0], // Data atual no formato YYYY-MM-DD
      tipo: "CREDITO", // Inicia com Crédito selecionado por padrão
    },
  });

  const tipoLancamento = form.watch("tipo");

  useEffect(() => {
    // Busca os dados filtrados do backend sempre que o tipo de lançamento muda
    if (tipoLancamento) {
      const endpoint = `/contas-contabeis?tipo=${tipoLancamento === "CREDITO" ? "RECEITA" : "DESPESA"}`;
      api.get(endpoint).then((res) => {
        setContasContabeis(res.data);
      });
    } else {
      setContasContabeis([]);
    }
  }, [tipoLancamento]);

  // Limpa o campo de conta selecionada sempre que a lista de opções mudar
  useEffect(() => {
    form.setValue("contaContabilId", "");
  }, [contasContabeis, form.setValue]);

  // ✅ CÓDIGO SIMPLIFICADO AQUI
  const filteredOptions = useMemo(() => {
    // A lista 'contasContabeis' já vem filtrada do backend.
    // Só precisamos mapeá-la para o formato que o Combobox espera.
    return contasContabeis.map((c) => ({
      value: c.id,
      label: `${c.codigo} - ${c.nome}`,
    }));
  }, [contasContabeis]); // A dependência agora é apenas 'contasContabeis'

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post("/transacoes", {
        ...data,
        contaCorrenteId,
      });
      toast.success("Lançamento realizado com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="tipo"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Lançamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CREDITO">Crédito (Entrada)</SelectItem>
                  <SelectItem value="DEBITO">Débito (Saída)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="valor"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="dataHora"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Lançamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="descricao"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Taxa bancária, Aporte de sócio"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contaContabilId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {tipoLancamento === "CREDITO"
                  ? "Origem do Crédito"
                  : "Destino do Débito"}
              </FormLabel>
              <Combobox
                options={filteredOptions}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecione a conta..."
                disabled={!tipoLancamento || filteredOptions.length === 0}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </form>
    </Form>
  );
}
