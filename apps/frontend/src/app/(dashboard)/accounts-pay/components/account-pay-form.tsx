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
import { useAuth } from "@/contexts/AuthContext";

// Interfaces
interface AccountPay {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  contaContabilId?: string | null;
  fornecedorId?: string | null;
  recoveryReportPeriod?: string | null;
  isInstallment?: boolean;
  totalInstallments?: number;
  createdAt: string; // Adicionado
}
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}
interface Fornecedor {
  id: string;
  name: string;
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
    fornecedorId: z.string().optional().nullable(),
    recoveryReportPeriod: z.string().optional().nullable(),
    isInstallment: z.boolean().default(false),
    totalInstallments: z.coerce
      .number()
      .int()
      .optional(),
    createdAt: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isInstallment) {
        return data.totalInstallments && data.totalInstallments >= 2;
      }
      return true;
    },
    {
      message: "O número de parcelas deve ser 2 ou mais.",
      path: ["totalInstallments"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export function AccountPayForm({ account, onSave }: AccountPayFormProps) {
  const { user } = useAuth();
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      description: account?.description || "",
      amount: account?.amount || 0,
      dueDate: account
        ? new Date(account.dueDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      contaContabilId: account?.contaContabilId || user?.settings?.defaultDespesaContaId || null,
      fornecedorId: account?.fornecedorId || null,
      recoveryReportPeriod: account?.recoveryReportPeriod || null,
      isInstallment: account?.isInstallment || false,
      totalInstallments: account?.totalInstallments ?? 2,
      createdAt: account ? new Date(account.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    },
  });

  const isInstallment = form.watch("isInstallment");

  useEffect(() => {
    api
      .get("/contas-contabeis?tipo=DESPESA")
      .then((res) => setContasContabeis(res.data));
    
    api
      .get("/pessoas?role=FORNECEDOR")
      .then((res) => setFornecedores(res.data));
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      const { createdAt, ...rest } = data;
      const payload: any = { ...rest, dueDate: new Date(data.dueDate) };

      if (account) {
        payload.createdAt = createdAt ? new Date(createdAt) : undefined;
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

        <FormField
          name="fornecedorId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor (Opcional)</FormLabel>
              <Combobox
                options={fornecedores.map((f) => ({
                  value: f.id,
                  label: f.name,
                }))}
                value={field.value ?? undefined}
                onChange={field.onChange}
                placeholder="Selecione um fornecedor..."
              />
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          name="recoveryReportPeriod"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Período de Custo (Recuperação)</FormLabel>
              <FormControl>
                <Input 
                  type="month"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {account && (
          <FormField
            name="createdAt"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Entrada</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Só mostra a opção de parcelar ao CRIAR uma nova conta */}
          <>
            <FormField
              control={form.control}
              name="isInstallment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue("totalInstallments", undefined);
                        }
                      }}
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

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
