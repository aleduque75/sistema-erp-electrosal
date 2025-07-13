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

interface Conta {
  id: string;
  nome: string;
}

const formSchema = z.object({
  contaCorrenteId: z.string({
    required_error: "A conta de origem é obrigatória.",
  }),
  contaContabilId: z.string({
    required_error: "A conta de passivo é obrigatória.",
  }),
  paidAt: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PayBillFormProps {
  billId: string;
  onSave: () => void;
}

export function PayBillForm({ billId, onSave }: PayBillFormProps) {
  const [contasCorrentes, setContasCorrentes] = useState<Conta[]>([]);
  const [contasPassivo, setContasPassivo] = useState<Conta[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { paidAt: new Date() },
  });

  useEffect(() => {
    api.get("/contas-correntes").then((res) => setContasCorrentes(res.data));
    // Busca contas do tipo PASSIVO para categorizar o pagamento da fatura
    api
      .get("/contas-contabeis?tipo=PASSIVO")
      .then((res) => setContasPassivo(res.data));
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post(`/credit-card-bills/${billId}/pay`, data);
      toast.success("Fatura paga com sucesso!");
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
                options={contasCorrentes.map((c) => ({
                  value: c.id,
                  label: c.nome,
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
              <FormLabel>Conta de Passivo (Cartão)</FormLabel>
              <Combobox
                options={contasPassivo.map((c) => ({
                  value: c.id,
                  label: c.nome,
                }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecione a conta do cartão..."
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
