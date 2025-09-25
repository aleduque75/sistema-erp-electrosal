// Possível caminho: apps/frontend/src/app/(dashboard)/contas-correntes/create/transacao-form.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useEffect, useState, useMemo } from "react";

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
import { Combobox } from "@/components/ui/combobox";

const createFormSchema = (moeda?: string) => z.object({
  descricao: z.string().min(3, "A descrição é obrigatória."),
  valor: moeda === 'BRL' ? z.coerce.number().positive("O valor deve ser maior que zero.") : z.coerce.number().optional(),
  goldAmount: moeda !== 'BRL' ? z.coerce.number().positive("O valor deve ser maior que zero.") : z.coerce.number().optional(),
  tipo: z.enum(["CREDITO", "DEBITO"]),
  contaContabilId: z.string({
    required_error: "Selecione uma conta contábil.",
  }),
  dataHora: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (AAAA-MM-DD)."),
});

interface TransacaoFormProps {
  contaCorrenteId: string;
  onSave: () => void;
  initialData?: TransacaoExtrato | null;
  moeda?: string;
}

interface TransacaoExtrato {
  id: string;
  dataHora: string;
  descricao: string;
  valor: number;
  goldAmount?: number;
  tipo: "CREDITO" | "DEBITO";
  contaContabilId: string;
  contaContabilNome: string;
}
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}

export function TransacaoForm({ contaCorrenteId, onSave, initialData, moeda }: TransacaoFormProps) {
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const formSchema = createFormSchema(moeda);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const tipoLancamento = form.watch("tipo");
  const dataHora = form.watch("dataHora");

  const handleConversion = async (fieldToConvert: 'valor' | 'goldAmount') => {
    if (!dataHora) return;

    try {
      const response = await api.get(`/quotations/by-date?date=${dataHora}&metal=AU`);
      const quotation = response.data;

      if (quotation) {
        const valor = form.getValues('valor');
        const goldAmount = form.getValues('goldAmount');

        if (fieldToConvert === 'valor' && valor) {
          const newGoldAmount = valor / quotation.buyPrice;
          form.setValue('goldAmount', newGoldAmount, { shouldValidate: true });
        } else if (fieldToConvert === 'goldAmount' && goldAmount) {
          const newValor = goldAmount * quotation.buyPrice;
          form.setValue('valor', newValor, { shouldValidate: true });
        }
      }
    } catch (error) {
      console.error('Failed to fetch quotation', error);
      toast.error('Cotação não encontrada para a data selecionada.');
    }
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        dataHora: initialData.dataHora.split('T')[0],
      });
    } else {
      form.reset({
        dataHora: new Date().toISOString().split("T")[0],
        tipo: "CREDITO",
        descricao: "",
        valor: 0,
        goldAmount: 0,
        contaContabilId: "",
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    if (tipoLancamento) {
      const endpoint = `/contas-contabeis?tipo=${tipoLancamento === "CREDITO" ? "RECEITA" : "DESPESA"}`;
      api.get(endpoint).then((res) => {
        setContasContabeis(res.data);
      });
    } else {
      setContasContabeis([]);
    }
  }, [tipoLancamento]);

  useEffect(() => {
    if (!initialData) {
      form.setValue("contaContabilId", "");
    }
  }, [contasContabeis, form.setValue, initialData]);

  useEffect(() => {
    if (!initialData) {
        form.setValue('valor', 0);
        form.setValue('goldAmount', 0);
    }
  }, [dataHora, initialData, form.setValue]);

  const filteredOptions = useMemo(() => {
    return contasContabeis.map((c) => ({
      value: c.id,
      label: `${c.codigo} - ${c.nome}`,
    }));
  }, [contasContabeis]);

  const onSubmit = async (data: FormValues) => {
    try {
      const method = initialData ? "patch" : "post";
      const url = initialData
        ? `/transacoes/${initialData.id}`
        : "/transacoes";

      await api[method](url, {
        ...data,
        contaCorrenteId,
      });

      toast.success(`Lançamento ${initialData ? 'atualizado' : 'realizado'} com sucesso!`);
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="tipo"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Lançamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CREDITO">Crédito (Entrada)</SelectItem>
                  <SelectItem value="DEBITO">Débito (Saída)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="dataHora"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Lançamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {moeda === 'BRL' ? (
          <FormField
            name="valor"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} onBlur={() => handleConversion('valor')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            name="goldAmount"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (Au g)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.0001" {...field} onBlur={() => handleConversion('goldAmount')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          name="descricao"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Taxa bancária, Aporte de sócio"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contaContabilId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {tipoLancamento === "CREDITO"
                  ? "Origem do Crédito"
                  : "Destino do Débito"}
              </FormLabel>
              <Combobox
                options={filteredOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione a conta..."
                disabled={!tipoLancamento || filteredOptions.length === 0}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </form>
    </Form>
  );
}
