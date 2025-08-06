"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
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

// Interfaces
interface ContaCorrente {
  id: string;
  nome: string;
}
interface AccountRec {
  id: string;
  amount: number;
  description: string;
}
interface ReceivePaymentFormProps {
  accountRec: AccountRec;
  onSave: () => void;
}

const formSchema = z.object({
  contaCorrenteId: z.string().min(1, "Selecione a conta de destino."),
  amountReceived: z.coerce
    .number()
    .positive("O valor recebido deve ser maior que zero."),
  receivedAt: z.string().min(1, "A data é obrigatória."),
});

export function ReceivePaymentForm({
  accountRec,
  onSave,
}: ReceivePaymentFormProps) {
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountReceived: accountRec.amount,
      receivedAt: new Date().toISOString().split("T")[0],
      contaCorrenteId: "",
    },
  });

  useEffect(() => {
    api.get("/contas-correntes").then((res) => setContasCorrentes(res.data));
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await api.patch(`/accounts-rec/${accountRec.id}/receive`, {
        ...data,
        receivedAt: new Date(data.receivedAt),
      });
      toast.success("Recebimento registrado com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Registrar recebimento para:{" "}
          <span className="font-medium">{accountRec.description}</span>
        </p>

        <FormField
          name="amountReceived"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Recebido (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="receivedAt"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Recebimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="contaCorrenteId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Depositar na Conta</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contasCorrentes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting
            ? "Salvando..."
            : "Confirmar Recebimento"}
        </Button>
      </form>
    </Form>
  );
}
