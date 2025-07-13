"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Interface para os dados da fatura que o form recebe
interface Bill {
  id: string;
  name: string;
  dueDate: Date;
  endDate: Date;
}

// Schema de validação para os campos editáveis
const formSchema = z.object({
  name: z.string().min(3, "O nome da fatura é obrigatório."),
  endDate: z.date({ required_error: "A data de fechamento é obrigatória." }),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
});

type FormValues = z.infer<typeof formSchema>;

interface BillFormProps {
  bill?: Bill | null;
  onSave: () => void;
}

export function CreditCardBillForm({ bill, onSave }: BillFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Preenche o formulário com os dados da fatura para edição
    defaultValues: {
      name: bill?.name || "",
      endDate: bill?.endDate ? new Date(bill.endDate) : new Date(),
      dueDate: bill?.dueDate ? new Date(bill.dueDate) : new Date(),
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Este formulário só funciona para edição
    if (!bill) return;

    try {
      await api.patch(`/credit-card-bills/${bill.id}`, data);
      toast.success("Fatura atualizada com sucesso!");
      onSave(); // Fecha o modal e atualiza a lista
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Falha ao atualizar a fatura."
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Fatura</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fatura de Julho" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Fechamento</FormLabel>
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
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Vencimento</FormLabel>
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
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </Form>
  );
}
