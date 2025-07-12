"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { format, parse } from "date-fns";

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
import { DateInput } from "@/components/ui/date-input";


interface CreateInstallmentTransactionsDto {
  description: string;
  totalAmount: number;
  installments: number;
  firstInstallmentDate: Date;
  creditCardId: string;
  categoryId?: string;
}
interface CreditCard {
  id: string;
  name: string;
  flag: string;
}

// Schema de validação
const formSchema = z.object({
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.date({ required_error: "A data da compra é obrigatória." }),
  installments: z.coerce.number().int().min(1).default(1),
  creditCardId: z.string({
    required_error: "O cartão de crédito é obrigatório.",
  }),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormProps {
  transaction?: (FormValues & { id: string }) | null; // Agora aceita null
  onSave: () => void;
}

export function CreditCardTransactionForm({ transaction, onSave }: FormProps) {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description || "",
      amount: transaction?.amount || 0,
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      installments: transaction?.installments || 1,
      creditCardId: transaction?.creditCardId || undefined,
      categoryId: transaction?.categoryId || undefined,
    },
  });

  // Busca os cartões de crédito disponíveis
  useEffect(() => {
    api
      .get("/credit-cards")
      .then((response) => setCreditCards(response.data))
      .catch(() => toast.error("Falha ao carregar os cartões de crédito."));
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      // ✅ LÓGICA INTELIGENTE: Decide qual endpoint chamar
      if (data.installments && data.installments > 1) {
        // Se for parcelado, monta o payload para o endpoint de parcelas
        const payload: CreateInstallmentTransactionsDto = {
          creditCardId: data.creditCardId,
          description: data.description,
          totalAmount: data.amount, // O amount do form é o valor total da compra
          installments: data.installments,
          firstInstallmentDate: data.date,
          categoryId: data.categoryId,
        };
        await api.post("/credit-card-transactions/installments", payload);
        toast.success(`${data.installments} parcelas criadas com sucesso!`);
      } else {
        // Se for à vista (1 parcela), chama o endpoint de criação única
        const payload = {
          creditCardId: data.creditCardId,
          description: data.description,
          amount: data.amount,
          date: data.date,
          categoryId: data.categoryId,
        };
        await api.post("/credit-card-transactions", payload);
        toast.success("Transação criada com sucesso!");
      }
      onSave(); // Fecha o modal e atualiza a lista
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="creditCardId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cartão de Crédito</FormLabel>
              <Combobox
                options={creditCards.map((card) => ({
                  value: card.id,
                  label: `${card.name} (${card.flag})`,
                }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecione o cartão..."
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Compra</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Almoço no restaurante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <FormField
            name="date"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Compra</FormLabel>
                <FormControl>
                  <DateInput
                    value={field.value ? format(field.value, "dd/MM/yyyy") : ""}
                    onAccept={(stringValue: any) => {
                      const newDate = parse(
                        stringValue,
                        "dd/MM/yyyy",
                        new Date()
                      );
                      if (newDate?.getTime() !== field.value?.getTime()) {
                        field.onChange(newDate);
                      }
                    }}
                    placeholder="DD/MM/AAAA"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="installments"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
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
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Transação"}
        </Button>
      </form>
    </Form>
  );
}
