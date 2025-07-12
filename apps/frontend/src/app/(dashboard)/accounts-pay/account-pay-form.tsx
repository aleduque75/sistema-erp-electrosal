"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { format, parse } from "date-fns";
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
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ✅ Schema agora espera um objeto Date
const formSchema = z
  .object({
    description: z.string().min(3, "A descrição é obrigatória."),
    amount: z.coerce.number().positive("O valor deve ser maior que zero."),
    dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
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
    defaultValues: {
      description: account?.description || "",
      amount: account?.amount || 0,
      dueDate: account?.dueDate ? new Date(account.dueDate) : new Date(),
      isInstallment:
        !!account?.totalInstallments && account.totalInstallments > 1,
      totalInstallments: account?.totalInstallments || 2, // Use um valor padrão
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (account) {
        // Para ATUALIZAR, ainda é bom remover os campos, pois não se edita o parcelamento.
        const { isInstallment, totalInstallments, ...payload } = data;
        await api.patch(`/accounts-pay/${account.id}`, payload);
        toast.success("Conta atualizada com sucesso!");
      } else {
        // Para CRIAR, ENVIE O OBJETO 'data' COMPLETO.
        // Ele contém 'isInstallment' e 'totalInstallments' que o backend precisa para decidir.
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

          {/* ✅ Campo de data substituído pelo Date Picker */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Vencimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
