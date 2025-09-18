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
import { TipoContaContabilPrisma } from "@/lib/types";

// Interfaces
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}
interface ContaContabilFormProps {
  initialData?: {
    nome: string;
    tipo: TipoContaContabilPrisma;
    contaPaiId?: string | null;
  };
  onSave: (newConta: ContaContabil) => void;
}

// Schema de validação
const formSchema = z.object({
  codigo: z.string().optional(), // Adicionado: Código da conta contábil (opcional)
  nome: z.string().min(2, "O nome é obrigatório."),
  tipo: z.nativeEnum(TipoContaContabilPrisma),
  contaPaiId: z.string().uuid().optional().nullable(),
});

export function ContaContabilForm({
  initialData,
  onSave,
}: ContaContabilFormProps) {
  const [contasPai, setContasPai] = useState<ContaContabil[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      codigo: "",
      nome: "",
      tipo: TipoContaContabilPrisma.DESPESA,
      contaPaiId: null,
    },
  });

  useEffect(() => {
    // Busca todas as contas que NÃO aceitam lançamento para serem "contas pai"
    api.get("/contas-contabeis").then((res) => {
      const contasAgrupadoras = res.data.filter((c) => !c.aceitaLancamento);
      setContasPai(contasAgrupadoras);
    });
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // 👇 CORREÇÃO APLICADA AQUI 👇
      const payload = {
        ...data,
        aceitaLancamento: true, // Garante que a nova conta sempre aceitará lançamentos
      };

      const response = await api.post("/contas-contabeis", payload);
      toast.success("Conta criada com sucesso!");
      onSave(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="codigo"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código da Conta (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 1.1.3.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="nome"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Conta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Assinaturas de Software" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="tipo"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TipoContaContabilPrisma).map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="contaPaiId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta Pai (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma (será uma conta principal)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contasPai.map((conta) => (
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
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Conta"}
        </Button>
      </form>
    </Form>
  );
}
