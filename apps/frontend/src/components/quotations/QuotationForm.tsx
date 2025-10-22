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
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TipoMetal } from "@sistema-erp-electrosal/core"; 

// 1. Array de Valores Literais (para o Zod)
const METAL_TYPES = ['AU', 'AG', 'RH'] as const;

// 2. CORREÇÃO DE TIPAGEM: Usamos a sintaxe `typeof` para referenciar o tipo do Enum na interface
interface QuotationFormProps { 
  onSave: () => void;
  id?: string;
  initialData?: {
    metal: (typeof TipoMetal)[keyof typeof TipoMetal]; 
    date: Date;
    buyPrice: number; 
    sellPrice: number; 
    tipoPagamento?: string;
  };
}

const formSchema = z.object({
  // 3. CORREÇÃO ZOD: Usando z.enum com o array literal
  metal: z.enum(METAL_TYPES, { required_error: "O metal é obrigatório." }),
  date: z.date({ required_error: "A data é obrigatória." }),
  buyPrice: z.coerce.number().min(0.01, "O valor de compra deve ser maior que zero."),
  sellPrice: z.coerce.number().min(0.01, "O valor de venda deve ser maior que zero."),
  tipoPagamento: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function QuotationForm({ onSave, id, initialData }: QuotationFormProps) { 
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: initialData.date,
    } : {
      // 4. CORREÇÃO DEFAULT VALUE: Usando a string literal 'AU'
      metal: 'AU', 
      date: new Date(), 
      buyPrice: 0, 
      sellPrice: 0, 
      tipoPagamento: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Ajustar o formato da data para string ISO antes de enviar ao backend
      const dataToSend = {
          ...data,
          date: data.date.toISOString(), 
      };

      if (id) {
        await api.patch(`/quotations/${id}`, dataToSend);
        toast.success("Cotação atualizada com sucesso!");
      } else {
        await api.post("/quotations", dataToSend);
        toast.success("Cotação salva com sucesso!");
      }
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
                  {/* Mapeando o array de strings literais */}
                  {METAL_TYPES.map((metal) => (
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
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
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
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="buyPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor de Compra (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sellPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor de Venda (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                />
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