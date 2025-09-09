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

interface PayAccountFormProps {
  accountId: string;
  onSave: () => void;
  initialAmount: number;
}

const formSchema = z.object({
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  paymentDate: z.string().min(1, "A data de pagamento é obrigatória."),
});

type FormValues = z.infer<typeof formSchema>;

export function PayAccountForm({ accountId, onSave, initialAmount }: PayAccountFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initialAmount,
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post(`/accounts-pay/${accountId}/pay`, {
        amount: data.amount,
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
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Registrando..." : "Registrar Pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
