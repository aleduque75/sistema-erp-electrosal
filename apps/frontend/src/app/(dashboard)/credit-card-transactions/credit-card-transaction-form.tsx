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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  contaContabilId?: string | null;
  creditCardId: string;
  isInstallment?: boolean;
  installments?: number;
}
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}
interface CreditCard {
  id: string;
  name: string;
}
interface FormProps {
  transaction?: Transaction | null;
  onSave: () => void;
}

// Schema de validação
const formSchema = z.object({
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.string().min(1, "A data é obrigatória."),
  contaContabilId: z.string().optional().nullable(),
  creditCardId: z.string().min(1, "O cartão de crédito é obrigatório."),
  isInstallment: z.boolean().default(false),
  installments: z.coerce
    .number()
    .int()
    .min(2, "Mínimo de 2 parcelas")
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreditCardTransactionForm({ transaction, onSave }: FormProps) {
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description || "",
      amount: transaction?.amount || 0,
      date: transaction
        ? new Date(transaction.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      contaContabilId: transaction?.contaContabilId || null,
      creditCardId: transaction?.creditCardId || "",
      isInstallment: transaction?.isInstallment || false,
      installments: transaction?.installments || 2,
    },
  });

  const isInstallment = form.watch("isInstallment");

  useEffect(() => {
    // Busca TODAS as contas que aceitam lançamento, sem filtro de tipo
    api.get("/contas-contabeis").then((res) => setContasContabeis(res.data));
    api.get("/credit-cards").then((res) => setCreditCards(res.data));
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = { ...data, date: new Date(data.date) };
      if (transaction) {
        await api.patch(`/credit-card-transactions/${transaction.id}`, payload);
        toast.success("Lançamento atualizado com sucesso!");
      } else {
        await api.post("/credit-card-transactions", payload);
        toast.success("Lançamento criado com sucesso!");
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
                  placeholder="Ex: Almoço, Uber, Assinatura..."
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
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Compra</FormLabel>
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
          name="creditCardId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cartão de Crédito</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {!transaction && (
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
                    <FormLabel>É uma compra parcelada?</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {isInstallment && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Total de Parcelas</FormLabel>
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
