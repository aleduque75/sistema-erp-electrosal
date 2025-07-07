"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useEffect, useState } from "react";

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
});

type FormValues = z.infer<typeof formSchema>;
interface TransacaoFormProps {
  contaCorrenteId: string;
  onSave: () => void;
}

export function TransacaoForm({ contaCorrenteId, onSave }: TransacaoFormProps) {
  const [contasContabeis, setContasContabeis] = useState([]);
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    api
      .get("/contas-contabeis")
      .then((res) =>
        setContasContabeis(res.data.filter((c) => c.aceitaLancamento))
      );
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post("/transacoes", {
        ...data,
        contaCorrenteId,
        moeda: "BRL",
        dataHora: new Date(),
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
          name="contaContabilId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contrapartida Contábil</FormLabel>
              <Combobox
                options={contasContabeis.map((c) => ({
                  value: c.id,
                  label: `${c.codigo} - ${c.nome}`,
                }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecione a conta..."
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
