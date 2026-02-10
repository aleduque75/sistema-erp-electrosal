"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";

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

// Interfaces
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}
interface CreditCard {
  id: string;
  name: string;
  flag: string;
  closingDay: number;
  dueDate: number;
  contaContabilPassivoId?: string | null;
}
interface CreditCardFormProps {
  initialData?: CreditCard;
  onSave: () => void;
}

// Schema de validação
const formSchema = z.object({
  name: z.string().min(2, "O nome do cartão é obrigatório."),
  flag: z.string().min(2, "A bandeira é obrigatória."),
  closingDay: z.coerce.number().int().min(1).max(31),
  dueDate: z.coerce.number().int().min(1).max(31),
  contaContabilPassivoId: z.string().uuid().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreditCardForm({ initialData, onSave }: CreditCardFormProps) {
  const [contasPassivo, setContasPassivo] = useState<ContaContabil[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      flag: initialData?.flag || "",
      closingDay: initialData?.closingDay || 1,
      dueDate: initialData?.dueDate || 10,
      contaContabilPassivoId: initialData?.contaContabilPassivoId || null,
    },
  });

  // --- 👇 INÍCIO DA CORREÇÃO ---
  // Extrai a função 'reset' do form
  const { reset } = form;

  // Este useEffect observa a prop 'initialData'.
  // Quando ela chegar (após a busca na API), ele "reseta" o formulário
  // preenchendo os campos com os dados do cartão a ser editado.
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);
  // --- 👆 FIM DA CORREÇÃO ---

  useEffect(() => {
    const fetchContasPassivo = async () => {
      try {
        const response = await api.get("/contas-contabeis?tipo=PASSIVO");
        setContasPassivo(response.data);
      } catch (error) {
        toast.error("Erro ao carregar contas de passivo.");
      }
    };
    fetchContasPassivo();
  }, []);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      contaContabilPassivoId: data.contaContabilPassivoId || null,
    };

    try {
      if (initialData) {
        await api.patch(`/credit-cards/${initialData.id}`, payload);
        toast.success("Cartão de crédito atualizado com sucesso!");
      } else {
        await api.post("/credit-cards", payload);
        toast.success("Cartão de crédito criado com sucesso!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cartão</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Nubank, Itaú Click" {...field} />
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
                <Input placeholder="Ex: Mastercard, Visa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="closingDay"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia do Fechamento</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="contaContabilPassivoId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta de Passivo Associada</FormLabel>
              {/* 👇 CORREÇÃO APLICADA AQUI 👇 */}
              <Select
                onValueChange={field.onChange}
                value={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta para a dívida da fatura..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* A opção "Nenhuma" com value="" foi removida para evitar o erro. */}
                  {/* O placeholder já cumpre a função de estado "não selecionado". */}
                  {contasPassivo
                    .filter((conta) => conta.id) // Garante que não há contas com ID vazio
                    .map((conta) => (
                      <SelectItem key={conta.id} value={conta.id}>
                        {conta.codigo} - {conta.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Cartão"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
