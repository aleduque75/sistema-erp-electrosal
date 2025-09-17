"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Pessoa } from "@/@types/pessoa";
import { getPessoas } from "@/services/pessoasApi";

const formSchema = z.object({
  clienteId: z.string().uuid({ message: "Por favor, selecione um cliente." }),
  dataEntrada: z.date({ required_error: "A data de entrada é obrigatória." }),
  descricaoMaterial: z.string().min(1, { message: "A descrição do material é obrigatória." }),
  volumeOuPesoEntrada: z.coerce.number().min(0.001, { message: "O valor deve ser maior que zero." }),
  unidadeEntrada: z.string().min(1, { message: "A unidade é obrigatória." }),
  observacoes: z.string().optional(),
});

export type AnaliseQuimicaFormValues = z.infer<typeof formSchema>;

interface AnaliseQuimicaFormProps {
  onSubmit: (values: AnaliseQuimicaFormValues) => void;
  isSubmitting: boolean;
  initialData?: Partial<AnaliseQuimicaFormValues>;
}

export function AnaliseQuimicaForm({
  onSubmit,
  isSubmitting,
  initialData,
}: AnaliseQuimicaFormProps) {
  const [clientes, setClientes] = useState<Pessoa[]>([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const data = await getPessoas('CLIENT');
        console.log("Dados de clientes recebidos:", data);
        setClientes(data);
      } catch (error) {
        console.error("Falha ao buscar clientes:", error);
        // Opcional: Adicionar um estado de erro para o select
      }
    };
    fetchClientes();
  }, []);

  const form = useForm<AnaliseQuimicaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      dataEntrada: new Date(),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clienteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <FormControl>
                <Combobox
                  options={clientes.map(cliente => ({ value: cliente.id, label: cliente.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione o cliente"
                  searchPlaceholder="Buscar cliente..."
                  emptyText="Nenhum cliente encontrado."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dataEntrada"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Entrada</FormLabel>
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
          name="descricaoMaterial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Material</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Limalha de Ouro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="volumeOuPesoEntrada"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Volume/Peso</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="100.5" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="unidadeEntrada"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Unidade</FormLabel>
                <FormControl>
                    <Input placeholder="g, kg, L" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Análise"}
        </Button>
      </form>
    </Form>
  );
}
