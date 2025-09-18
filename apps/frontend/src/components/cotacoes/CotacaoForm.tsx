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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TipoMetal } from "@prisma/client";

interface CotacaoFormProps {
  onSave: () => void;
  initialData?: {
    metal: TipoMetal;
    data: Date;
    valorCompra: number;
    valorVenda: number;
    tipoPagamento?: string;
  };
}

const formSchema = z.object({
  metal: z.nativeEnum(TipoMetal, { required_error: "O metal é obrigatório." }),
  data: z.date({ required_error: "A data é obrigatória." }),
  valorCompra: z.coerce.number().min(0.01, "O valor de compra deve ser maior que zero."),
  valorVenda: z.coerce.number().min(0.01, "O valor de venda deve ser maior que zero."),
  tipoPagamento: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CotacaoForm({ onSave, initialData }: CotacaoFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      metal: TipoMetal.AU,
      data: new Date(),
      valorCompra: 0,
      valorVenda: 0,
      tipoPagamento: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post("/cotacoes", data);
      toast.success("Cotação salva com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro ao salvar a cotação.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="metal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o metal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TipoMetal).map((metal) => (
                    <SelectItem key={metal} value={metal}>
                      {metal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
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
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
          name="valorCompra"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor de Compra (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valorVenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor de Venda (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipoPagamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Pagamento (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: PIX, Cheque" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Salvar Cotação
        </Button>
      </form>
    </Form>
  );
}
