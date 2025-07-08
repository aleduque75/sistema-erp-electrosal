"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
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
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: any;
  aceitaLancamento: boolean;
  contaPaiId?: string | null;
}

const formSchema = z.object({
  nome: z.string().min(3, "O nome é obrigatório."),
  tipo: z.enum([
    "ATIVO",
    "PASSIVO",
    "PATRIMONIO_LIQUIDO",
    "RECEITA",
    "DESPESA",
  ]),
  aceitaLancamento: z.boolean().default(false),
  contaPaiId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ContaContabilFormProps {
  conta?: ContaContabil | null;
  onSave: () => void;
}

export function ContaContabilForm({ conta, onSave }: ContaContabilFormProps) {
  const [contasPai, setContasPai] = useState<ContaContabil[]>([]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: conta?.codigo || "",
      nome: conta?.nome || "",
      tipo: conta?.tipo || "DESPESA",
      aceitaLancamento: conta?.aceitaLancamento || false,
      contaPaiId: conta?.contaPaiId || null,
    },
  });
  const { control, handleSubmit, watch, setValue } = form;
  const contaPaiId = watch("contaPaiId");

  useEffect(() => {
    async function fetchParentAccounts() {
      try {
        const response = await api.get("/contas-contabeis");
        const parentAccounts = response.data.filter(
          (c: ContaContabil) => !c.aceitaLancamento && c.id !== conta?.id
        );
        setContasPai(parentAccounts);
      } catch (error) {
        toast.error("Falha ao buscar contas pai.");
      }
    }
    fetchParentAccounts();
  }, [conta?.id]);

  

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, contaPaiId: data.contaPaiId || null };
    try {
      if (conta) {
        await api.patch(`/contas-contabeis/${conta.id}`, payload);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await api.post("/contas-contabeis", payload);
        toast.success("Conta criada com sucesso!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <FormField
            name="nome"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Despesas com Pessoal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="contaPaiId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta Pai (Opcional)</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecione a conta pai..."
                  options={[
                    { value: null, label: "Nenhuma (Conta Raiz)" },
                    ...contasPai.map((pai) => ({
                      value: pai.id,
                      label: `${pai.codigo} - ${pai.nome}`,
                    })),
                  ]}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Conta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {formSchema.shape.tipo.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
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
          name="aceitaLancamento"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Aceita Lançamentos?</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
