// apps/frontend/src/app/(dashboard)/contas-correntes/conta-corrente-form.tsx

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContaCorrenteType } from "@sistema-erp-electrosal/core";

// 1. DEFINIÇÃO DO ARRAY DE VALORES LITERAIS (Para o Zod)
const CONTA_CORRENTE_TYPES = [
  'BANCO',
  'FORNECEDOR_METAL',
  'EMPRESTIMO',
] as const;

// DEFINIÇÃO DO SCHEMA CORRIGIDA
const formSchema = z.object({
  nome: z.string().min(3, "O nome da conta é obrigatório."),
  numeroConta: z.string().min(1, "O número/identificador é obrigatório."),
  agencia: z.string().optional(),
  saldoInicial: z.coerce
    .number()
    .min(0, "O saldo não pode ser negativo.")
    .default(0),
  limite: z.coerce.number().min(0).default(0).optional(),
  // 2. USANDO z.enum COM AS STRINGS LITERAIS
  type: z.enum(CONTA_CORRENTE_TYPES).default('BANCO'),
});

type FormValues = z.infer<typeof formSchema>;

interface ContaCorrenteFormProps {
  conta?: {
    id: string;
    nome: string;
    numeroConta: string;
    agencia?: string | null;
    saldoInicial: number;
    limite?: number | null;
    // Tipagem ajustada para o tipo de string literal que o Enum representa
    type?: (typeof ContaCorrenteType)[keyof typeof ContaCorrenteType] | null; 
  } | null;
  onSave: () => void;
}

export function ContaCorrenteForm({ conta, onSave }: ContaCorrenteFormProps) {
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: conta?.nome ?? "",
      numeroConta: conta?.numeroConta ?? "",
      agencia: conta?.agencia ?? "", 
      
      // O valor inicial é obtido da conta existente ou é 0
      saldoInicial: conta?.saldoInicial ?? 0, 
      
      limite: conta?.limite ?? 0, 
      
      // 3. CORREÇÃO FINAL: Usa o valor da conta ou a string literal 'BANCO'
      type: (conta?.type ?? 'BANCO') as (typeof ContaCorrenteType)[keyof typeof ContaCorrenteType],
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (conta) {
        const { saldoInicial, ...updateData } = data;
        await api.patch(`/contas-correntes/${conta.id}`, updateData);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await api.post("/contas-correntes", data);
        toast.success("Conta criada com sucesso!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro ao salvar a conta.");
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
        <FormField
          name="type"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Conta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* USANDO AS STRINGS LITERAIS NOS SELECT ITEMS */}
                  <SelectItem value="BANCO">Banco</SelectItem>
                  <SelectItem value="FORNECEDOR_METAL">Fornecedor de Metal</SelectItem>
                  <SelectItem value="EMPRESTIMO">Empréstimo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {!conta && (
          <FormField
            name="saldoInicial"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Inicial (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          name="limite"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite (Cheque Especial)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
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