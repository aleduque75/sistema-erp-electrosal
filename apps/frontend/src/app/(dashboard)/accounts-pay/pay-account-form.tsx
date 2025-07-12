"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { format, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { DateInput } from "@/components/ui/date-input";

// Tipagem para os dados que vamos buscar
interface ContaCorrente {
  id: string;
  nome: string;
}
interface ContaContabil {
  id: string;
  descricao: string; // O frontend espera 'descricao', mas o backend envia 'nome'. Corrigiremos isso.
}

const formSchema = z.object({
  contaCorrenteId: z.string({
    required_error: "A conta de origem é obrigatória.",
  }),
  contaContabilId: z.string({
    required_error: "A conta contábil é obrigatória.",
  }),
  paidAt: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PayAccountFormProps {
  accountId: string;
  onSave: () => void;
}

export function PayAccountForm({ accountId, onSave }: PayAccountFormProps) {
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paidAt: new Date(),
    },
  });

  useEffect(() => {
    // Busca contas correntes
    api
      .get("/contas-correntes")
      .then((response) => setContasCorrentes(response.data))
      .catch(() => toast.error("Falha ao carregar contas correntes."));

    // <<< CORREÇÃO AQUI: Adicionado o filtro por tipo=DESPESA
    api
      .get("/contas-contabeis?tipo=DESPESA")
      .then((response) => setContasContabeis(response.data))
      .catch(() => toast.error("Falha ao carregar categorias de despesa."));
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post(`/accounts-pay/${accountId}/pay`, data);
      toast.success("Pagamento registrado com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="contaCorrenteId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pagar com a conta</FormLabel>
              <Combobox
                options={contasCorrentes.map((conta) => ({
                  value: conta.id,
                  label: conta.nome,
                }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecione a conta de origem..."
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="contaContabilId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categorizar como (Conta Contábil)</FormLabel>
              <Combobox
                // O backend envia 'nome', mas o Combobox espera 'label'.
                // O seu modelo ContaContabil no backend tem o campo 'nome'.
                options={contasContabeis.map((conta) => ({
                  value: conta.id,
                  label: (conta as any).nome || conta.descricao, // Usar 'nome' que vem da API
                }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecione a categoria..."
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="paidAt"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Pagamento</FormLabel>
              <DateInput
                value={field.value ? format(field.value, "dd/MM/yyyy") : ""}
                onAccept={(val: any) =>
                  field.onChange(parse(val, "dd/MM/yyyy", new Date()))
                }
                placeholder="DD/MM/AAAA"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Registrando..."
            : "Confirmar Pagamento"}
        </Button>
      </form>
    </Form>
  );
}
