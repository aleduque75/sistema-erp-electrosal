"use client";

import { useForm } from "react-hook-form";
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
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces
interface AccountPay {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  contaContabilId?: string | null;
  isInstallment?: boolean;
  totalInstallments?: number;
}
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}
interface AccountPayFormProps {
  account?: AccountPay | null;
  onSave: () => void;
}

// Schema de validação
const formSchema = z
  .object({
    description: z.string().min(3, "A descrição é obrigatória."),
    amount: z.coerce.number().positive("O valor deve ser maior que zero."),
    dueDate: z.string().min(1, "A data de vencimento é obrigatória."),
    contaContabilId: z.string().optional().nullable(),
    isInstallment: z.boolean().default(false),
    totalInstallments: z.coerce
      .number()
      .int()
      .min(2, "Mínimo de 2 parcelas")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.isInstallment && !data.totalInstallments) {
        return false;
      }
      return true;
    },
    {
      message: "O número de parcelas é obrigatório.",
      path: ["totalInstallments"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export function AccountPayForm({ account, onSave }: AccountPayFormProps) {
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: account?.description || "",
      amount: account?.amount || 0,
      dueDate: account
        ? new Date(account.dueDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      contaContabilId: account?.contaContabilId || null,
      isInstallment: account?.isInstallment || false,
      totalInstallments: account?.totalInstallments || 2,
    },
  });

  const isInstallment = form.watch("isInstallment");

  useEffect(() => {
    // Busca contas de Despesa e Passivo para o Contas a Pagar
    api
      .get("/contas-contabeis?tipo=DESPESA")
      .then((res) => setContasContabeis(res.data));
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = { ...data, dueDate: new Date(data.dueDate) };
      if (account) {
        await api.patch(`/accounts-pay/${account.id}`, payload);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await api.post("/accounts-pay", payload);
        toast.success("Conta(s) provisionada(s) com sucesso!");
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
                <Input
                  placeholder="Ex: Aluguel, Compra de material"
                  {...field}
                />
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
              <FormLabel>
                {isInstallment ? "Valor Total (a ser parcelado)" : "Valor (R$)"}
              </FormLabel>
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
              <FormLabel>
                {isInstallment
                  ? "Data do Primeiro Vencimento"
                  : "Data de Vencimento"}
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
              <FormLabel>Categoria (Plano de Contas)</FormLabel>
              <Combobox
                options={contasContabeis.map((c) => ({
                  value: c.id,
                  label: `${c.codigo} - ${c.nome}`,
                }))}
                value={field.value ?? undefined}
                onChange={field.onChange}
                placeholder="Selecione uma categoria..."
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Só mostra a opção de parcelar ao CRIAR uma nova conta */}
        {!account && (
          <>
            <FormField
              control={form.control}
              name="isInstallment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Provisionar em parcelas?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {isInstallment && (
              <FormField
                control={form.control}
                name="totalInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min="2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
