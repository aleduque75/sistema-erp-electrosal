"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";

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
import { Switch } from "@/components/ui/switch";

// ✅ 1. SCHEMA SIMPLIFICADO: dueDate agora é uma string, como o input nativo retorna
const formSchema = z
  .object({
    description: z.string().min(3, "A descrição é obrigatória."),
    amount: z.coerce.number().positive("O valor deve ser maior que zero."),
    dueDate: z
      .string({ required_error: "A data de vencimento é obrigatória." })
      .min(1, "A data de vencimento é obrigatória."),
    isInstallment: z.boolean().default(false),
    totalInstallments: z.coerce.number().int().min(2).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.isInstallment &&
      (!data.totalInstallments || data.totalInstallments < 2)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de parcelas é obrigatório.",
        path: ["totalInstallments"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface AccountPayFormProps {
  account?:
    | (Omit<FormValues, "dueDate"> & { id: string; dueDate: string })
    | null;
  onSave: () => void;
}

export function AccountPayForm({ account, onSave }: AccountPayFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // ✅ 2. VALOR PADRÃO AJUSTADO: dueDate agora é uma string no formato 'yyyy-MM-dd'
    defaultValues: {
      description: account?.description || "",
      amount: account?.amount || 0,
      dueDate: account?.dueDate
        ? format(new Date(account.dueDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      isInstallment:
        !!account?.totalInstallments && account.totalInstallments > 1,
      totalInstallments: account?.totalInstallments || undefined,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (account) {
        await api.patch(`/accounts-pay/${account.id}`, data);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await api.post("/accounts-pay", data);
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
                <Input placeholder="Ex: Aluguel, Fornecedor X" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* ✅ 3. CAMPO DE DATA SIMPLIFICADO para um input nativo */}
          <FormField
            name="dueDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          name="isInstallment"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>É parcelado?</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch("isInstallment") && (
          <FormField
            name="totalInstallments"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Parcelas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="2"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
