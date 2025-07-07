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
import { DateInput } from "@/components/ui/date-input"; // Usando nosso input com máscara

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
});

type FormValues = z.infer<typeof formSchema>;

interface AccountRecFormProps {
  account?: FormValues & { id: string };
  onSave: () => void;
}

export function AccountRecForm({ account, onSave }: AccountRecFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: account?.description || "",
      amount: account?.amount || 0,
      dueDate: account?.dueDate ? new Date(account.dueDate) : new Date(),
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (account) {
        await api.patch(`/accounts-rec/${account.id}`, data);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await api.post("/accounts-rec", data);
        toast.success("Conta criada com sucesso!");
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
                <Input placeholder="Ex: Venda para Cliente X" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="amount"
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
            name="dueDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimento</FormLabel>
                <FormControl>
                  <DateInput
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
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
