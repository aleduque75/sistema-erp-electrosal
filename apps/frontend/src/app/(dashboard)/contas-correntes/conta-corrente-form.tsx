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
  nome: z.string().min(3, "O nome é obrigatório."),
  numeroConta: z.string().min(1, "O número/identificador é obrigatório."),
  agencia: z.string().optional(),
  moeda: z.string().default("BRL"),
  saldoInicial: z.coerce.number().min(0, "O saldo não pode ser negativo."),
});

type FormValues = z.infer<typeof formSchema>;

interface ContaCorrenteFormProps {
  conta?: FormValues & { id: string };
  onSave: () => void;
}

export function ContaCorrenteForm({ conta, onSave }: ContaCorrenteFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: conta?.nome || "",
      numeroConta: conta?.numeroConta || "",
      agencia: conta?.agencia || "",
      moeda: conta?.moeda || "BRL",
      saldoInicial: conta ? undefined : 0, // Saldo inicial só na criação
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (conta) {
        // Na edição, não enviamos o saldo inicial
        const { saldoInicial, ...updateData } = data;
        await api.patch(`/contas-correntes/${conta.id}`, updateData);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await api.post("/contas-correntes", data);
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
          name="nome"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Conta</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Caixa Principal, Banco Inter"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="numeroConta"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número / ID</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 12345-6" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="agencia"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agência</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 0001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {!conta && ( // Mostra o campo de saldo inicial apenas na criação
          <FormField
            name="saldoInicial"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Inicial (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
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
