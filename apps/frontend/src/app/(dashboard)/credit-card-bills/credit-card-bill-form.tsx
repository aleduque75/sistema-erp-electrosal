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
import { DateInput } from "@/components/ui/date-input";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  dueDate: z.preprocess(
    (arg) => {
      if (typeof arg === "string" && arg.length >= 8)
        return new Date(arg.split("/").reverse().join("-"));
      if (arg instanceof Date) return arg;
    },
    z.date({ required_error: "A data de vencimento é obrigatória." })
  ),
  closingDate: z.preprocess(
    (arg) => {
      if (typeof arg === "string" && arg.length >= 8)
        return new Date(arg.split("/").reverse().join("-"));
      if (arg instanceof Date) return arg;
    },
    z.date({ required_error: "A data de fechamento é obrigatória." })
  ),
  paymentDate: z.preprocess(
    (arg) => {
      if (typeof arg === "string" && arg.length >= 8)
        return new Date(arg.split("/").reverse().join("-"));
      if (arg instanceof Date) return arg;
    },
    z.date({ required_error: "A data de pagamento é obrigatória." })
  ),
  installments: z.coerce.number().int().min(1, "Mínimo de 1 parcela.").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreditCardBillFormProps {
  bill?: FormValues & { id: string };
  onSave: () => void;
}

export function CreditCardBillForm({ bill, onSave }: CreditCardBillFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: bill?.description || "",
      amount: bill?.amount || 0,
      dueDate: bill?.dueDate ? new Date(bill.dueDate) : new Date(),
      closingDate: bill?.closingDate ? new Date(bill.closingDate) : new Date(),
      paymentDate: bill?.paymentDate ? new Date(bill.paymentDate) : new Date(),
      installments: bill?.installments || 1,
    },
  });

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      dueDate: data.dueDate.toISOString(),
      closingDate: data.closingDate.toISOString(),
      paymentDate: data.paymentDate.toISOString(),
    };
    try {
      if (bill) {
        await api.patch(`/credit-card-bills/${bill.id}`, payload);
        toast.success("Fatura atualizada com sucesso!");
      } else {
        await api.post("/credit-card-bills", payload);
        toast.success("Fatura criada com sucesso!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fatura Nubank Jun/2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="amount"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            name="closingDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Fechamento</FormLabel>
                <FormControl>
                  <DateInput
                    className="w-full"
                    value={
                      field.value
                        ? new Date(field.value).toLocaleDateString("pt-BR")
                        : ""
                    }
                    onAccept={(value: any) => field.onChange(value)}
                    placeholder="DD/MM/AAAA"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="dueDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento</FormLabel>
                <FormControl>
                  <DateInput
                    className="w-full"
                    value={
                      field.value
                        ? new Date(field.value).toLocaleDateString("pt-BR")
                        : ""
                    }
                    onAccept={(value: any) => field.onChange(value)}
                    placeholder="DD/MM/AAAA"
                  />
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
                <FormLabel>Data Limite de Pagamento</FormLabel>
                <FormControl>
                  <DateInput
                    className="w-full"
                    value={
                      field.value
                        ? new Date(field.value).toLocaleDateString("pt-BR")
                        : ""
                    }
                    onAccept={(value: any) => field.onChange(value)}
                    placeholder="DD/MM/AAAA"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          name="installments"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Parcelas (da fatura)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
