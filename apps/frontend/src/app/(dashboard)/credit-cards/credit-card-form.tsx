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

const formSchema = z.object({
  name: z.string().min(3, "O nome do cartão é obrigatório."),
  flag: z.string().min(3, "A bandeira é obrigatória."),
  closingDay: z.coerce
    .number()
    .int()
    .min(1)
    .max(31, "O dia deve ser entre 1 e 31."),
  dueDate: z.coerce
    .number()
    .int()
    .min(1)
    .max(31, "O dia deve ser entre 1 e 31."),
});

type FormValues = z.infer<typeof formSchema>;

interface CreditCardFormProps {
  card?: (FormValues & { id: string }) | null; // Agora aceita null
  onSave: () => void;
}

export function CreditCardForm({ card, onSave }: CreditCardFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: card?.name || "",
      flag: card?.flag || "",
      closingDay: card?.closingDay || 20,
      dueDate: card?.dueDate || 28,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (card) {
        await api.patch(`/credit-cards/${card.id}`, data);
        toast.success("Cartão atualizado com sucesso!");
      } else {
        await api.post("/credit-cards", data);
        toast.success("Cartão criado com sucesso!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cartão</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Nubank Ultravioleta" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="flag"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bandeira</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Mastercard" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="closingDay"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia do Fechamento</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="31" {...field} />
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
                <FormLabel>Dia do Vencimento</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="31" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Cartão"}
        </Button>
      </form>
    </Form>
  );
}
