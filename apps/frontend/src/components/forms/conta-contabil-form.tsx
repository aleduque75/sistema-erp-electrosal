"use client";

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
import { TipoContaContabilPrisma } from "@/lib/types"; // Supondo que você tenha um arquivo de tipos

interface ContaContabilFormProps {
  initialData?: { nome: string; tipo: string; contaPaiId?: string | null };
  onSave: () => void;
}

const formSchema = z.object({
  nome: z.string().min(2, "O nome é obrigatório."),
  tipo: z.nativeEnum(TipoContaContabilPrisma),
  contaPaiId: z.string().uuid().optional().nullable(),
});

export function ContaContabilForm({
  initialData,
  onSave,
}: ContaContabilFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || { nome: "", tipo: "DESPESA" },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Juntamos os dados do formulário com a propriedade que faltava
      const payload = {
        ...data,
        aceitaLancamento: true, // <-- ADICIONADO AQUI
      };

      await api.post("/contas-contabeis", payload);
      toast.success("Conta criada com sucesso!");
      onSave(); // Avisa a página de importação para recarregar as contas
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
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled
              >
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
        {/* Campo para conta pai pode ser adicionado aqui depois, se necessário */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Conta"}
        </Button>
      </form>
    </Form>
  );
}

// Em um arquivo como `src/lib/types.ts`, você precisaria deste enum:
/*
export enum TipoContaContabilPrisma {
  ATIVO = "ATIVO",
  PASSIVO = "PASSIVO",
  PATRIMONIO_LIQUIDO = "PATRIMONIO_LIQUIDO",
  RECEITA = "RECEITA",
  DESPESA = "DESPESA",
}
*/
