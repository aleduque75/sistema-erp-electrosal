"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


// Interfaces
interface Categoria {
  id: string;
  nome: string;
}
interface CreditCard {
  id: string;
  name: string;
}
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  creditCardId: string;
  contaContabilId?: string | null;
  isInstallment: boolean;
  installments?: number | null;
}

// Schema de validação
const formSchema = z
  .object({
    description: z.string().min(3, "A descrição é obrigatória."),
    amount: z.coerce.number().positive("O valor total é obrigatório."),
    date: z.date({ required_error: "A data da compra é obrigatória." }),
    creditCardId: z.string({ required_error: "O cartão é obrigatório." }),
    contaContabilId: z.string().optional(),
    isInstallment: z.boolean().default(false),
    installments: z.coerce.number().int().min(2).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isInstallment && (!data.installments || data.installments < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de parcelas é obrigatório.",
        path: ["installments"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface FormProps {
  transaction?: Transaction | null;
  onSave: () => void;
}

export function CreditCardTransactionForm({ transaction, onSave }: FormProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description || "",
      amount: transaction?.amount || 0,
      date: transaction?.date && isValid(new Date(transaction.date)) ? new Date(transaction.date) : new Date(),
      creditCardId: transaction?.creditCardId || "",
      contaContabilId: transaction?.contaContabilId || undefined,
      isInstallment: transaction?.isInstallment || false,
      installments: transaction?.installments || 2,
    },
  });

  useEffect(() => {
    api
      .get("/contas-contabeis?tipo=DESPESA")
      .then((res) => setCategorias(res.data));
    api.get("/credit-cards").then((res) => setCreditCards(res.data));
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      if (transaction) {
        // Na edição, não permitimos alterar o parcelamento, então removemos os campos.
        const { isInstallment, installments, creditCardId, ...payload } = data;
        await api.patch(`/credit-card-transactions/${transaction.id}`, payload);
        toast.success("Transação atualizada com sucesso!");
      } else {
        // Na criação, enviamos todos os dados, incluindo os de parcela.
        await api.post("/credit-card-transactions", data);
        toast.success("Transação criada com sucesso!");
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
          name="creditCardId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cartão de Crédito</FormLabel>
              <Combobox
                options={creditCards.map((card) => ({
                  value: card.id,
                  label: card.name,
                }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecione o cartão..."
                disabled={!!transaction} // Desabilita na edição
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
              <FormLabel>Descrição da Despesa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Jantar no restaurante" {...field} />
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
              <FormLabel>Categoria da Despesa</FormLabel>
              <Combobox
                options={categorias.map((cat) => ({
                  value: cat.id,
                  label: cat.nome,
                }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecione a categoria..."
              />
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
                <FormLabel>
                  {form.watch("isInstallment")
                    ? "Valor Total (R$)"
                    : "Valor (R$)"}
                </FormLabel>
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
              <FormItem className="flex flex-col">
                <FormLabel>
                  {form.watch("isInstallment")
                    ? "Data da 1ª Parcela"
                    : "Data da Compra"}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value && isValid(field.value)
                          ? format(field.value, "dd/MM/yyyy")
                          : "DD/MM/AAAA"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Mostra opções de parcela apenas na CRIAÇÃO */}
        {!transaction && (
          <>
            <FormField
              control={form.control}
              name="isInstallment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Compra Parcelada?</FormLabel>
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
                name="installments"
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
                          field.onChange(parseInt(e.target.value, 10) || 2)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
