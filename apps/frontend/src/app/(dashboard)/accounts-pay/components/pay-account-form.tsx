"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
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
import { useEffect, useState } from "react";

interface AccountPay {
  id: string;
  description: string;
  amount: number;
}

interface PayAccountFormProps {
  account: AccountPay;
  onSave: () => void;
}

const formSchema = z.object({
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  paymentDate: z.string().min(1, "A data de pagamento é obrigatória."),
  quotation: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PayAccountForm({ account, onSave }: PayAccountFormProps) {
  const [quotation, setQuotation] = useState<number | undefined>();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: account.amount,
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const paymentDate = form.watch("paymentDate");

  useEffect(() => {
    if (paymentDate) {
      api.get(`/quotations/find-by-date?date=${paymentDate}&metal=AU`).then(res => {
        if(res.data) {
          setQuotation(res.data.buyPrice);
          form.setValue("quotation", res.data.buyPrice);
        }
      });
    }
  }, [paymentDate, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post(`/accounts-pay/${account.id}/pay`, {
        ...data,
        paymentDate: new Date(data.paymentDate),
      });
      toast.success("Pagamento registrado com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro ao registrar o pagamento.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">{account.description}</p>
        <FormField
          name="amount"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Pagamento (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="paymentDate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Pagamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="quotation"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cotação do Ouro (compra)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Registrando..." : "Registrar Pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
