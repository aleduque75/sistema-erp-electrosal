import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react"; // Adicionado useState

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { ContaContabil, ContaCorrenteType } from "@prisma/client";
import { Switch } from "@/components/ui/switch"; // Adicionado

// 1. DEFINIÇÃO DO ARRAY DE VALORES LITERAIS (Para o Zod)
const CONTA_CORRENTE_TYPES = [
  'BANCO',
  'FORNECEDOR_METAL',
  'EMPRESTIMO',
  'CLIENTE',
] as const;

// DEFINIÇÃO DO SCHEMA CORRIGIDA

const baseSchema = z.object({

  nome: z.string().min(3, "O nome da conta é obrigatório."),

  numeroConta: z.string().min(1, "O número/identificador é obrigatório."),

  agencia: z.string().optional(),

  limite: z.coerce.number().min(0).default(0).optional(),

  type: z.enum(CONTA_CORRENTE_TYPES).default('BANCO'),

  contaContabilId: z.string().optional(),

  isActive: z.boolean().default(true),

});



const createSchema = baseSchema.extend({

  initialBalanceBRL: z.coerce.number().min(0).default(0),

  initialBalanceGold: z.coerce.number().min(0).default(0),

});



const editSchema = baseSchema;



type FormValues = z.infer<typeof createSchema>;



interface ContaCorrenteFormProps {

  conta?: {

    id: string;

    nome: string;

    numeroConta: string;

    agencia?: string | null;

    initialBalanceBRL: number; // Atualizado

    initialBalanceGold: number; // Atualizado

    limite?: number | null;

    type?: (typeof ContaCorrenteType)[keyof typeof ContaCorrenteType] | null; 

    contaContabilId?: string | null;

    isActive: boolean;

  } | null;

  onSave: () => void;

}



export function ContaCorrenteForm({ conta, onSave }: ContaCorrenteFormProps) {

  const { data: contasContabeis, isLoading: isLoadingContasContabeis } = useQuery<ContaContabil[]>({

    queryKey: ["contasContabeis"],

    queryFn: async () => {

      const response = await api.get("/contas-contabeis");

      return response.data;

    },

  });



  const { data: marketData } = useQuery({

    queryKey: ["marketDataLatest"],

    queryFn: async () => {

      const response = await api.get("/market-data/latest");

      return response.data;

    },

  });



  const form = useForm<FormValues>({

    resolver: zodResolver(conta ? editSchema : createSchema),

    defaultValues: {

      nome: conta?.nome ?? "",

      numeroConta: conta?.numeroConta ?? "",

      agencia: conta?.agencia ?? "", 

      initialBalanceBRL: conta?.initialBalanceBRL ?? 0, 

      initialBalanceGold: conta?.initialBalanceGold ?? 0,

      limite: conta?.limite ?? 0, 

      type: (conta?.type ?? 'BANCO') as (typeof ContaCorrenteType)[keyof typeof ContaCorrenteType],

      contaContabilId: conta?.contaContabilId ?? "",

      isActive: conta?.isActive ?? true,

    },

  });



  // Watch for changes in BRL to auto-calculate Gold

  const initialBalanceBRL = form.watch("initialBalanceBRL");



  // Effect for auto-conversion

  const [lastEdited, setLastEdited] = useState<"BRL" | "GOLD" | null>(null);



  useEffect(() => {

    if (conta) return; // Don't auto-calculate on edit mode initially or if strictly read-only logic differs

    if (lastEdited === "GOLD") return; // Avoid loop if user is editing Gold



    if (marketData && initialBalanceBRL > 0) {

      const goldPrice = Number(marketData.goldPriceBrl) || 0;

      if (goldPrice > 0) {

        const calculatedGold = initialBalanceBRL / goldPrice;

        // Use setValue with shouldValidate: true to ensure form state updates correctly

        // But only if Gold hasn't been manually touched recently? 

        // Simple approach: One-way binding from BRL -> Gold as "suggestion"

        form.setValue("initialBalanceGold", parseFloat(calculatedGold.toFixed(4)));

      }

    }

  }, [initialBalanceBRL, marketData, conta, form, lastEdited]);





    const onSubmit = async (data: FormValues) => {





      // Sanitização de dados





      const payload = { ...data };





      if (!payload.contaContabilId) {





          delete (payload as any).contaContabilId;





      }





  





      try {





        if (conta) {





          await api.patch(`/contas-correntes/${conta.id}`, payload);





          toast.success("Conta atualizada com sucesso!");





        } else {





          await api.post("/contas-correntes", payload);





          toast.success("Conta criada com sucesso!");





        }





        onSave();





      } catch (err: any) {





        toast.error(err.response?.data?.message || "Ocorreu um erro ao salvar a conta.");





      }





    };



  const contaContabilOptions: ComboboxOption[] =

    contasContabeis?.map((conta) => ({

      value: conta.id,

      label: `${conta.codigo} - ${conta.nome}`,

    })) || [];



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

        {/* ... (grid for number/agency) ... */}

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

                  <SelectItem value="BANCO">Banco</SelectItem>

                  <SelectItem value="FORNECEDOR_METAL">Fornecedor de Metal</SelectItem>

                  <SelectItem value="EMPRESTIMO">Empréstimo</SelectItem>

                  <SelectItem value="CLIENTE">Cliente</SelectItem>

                </SelectContent>

              </Select>

              <FormMessage />

            </FormItem>

          )}

        />

        <FormField

          name="contaContabilId"

          control={form.control}

          render={({ field }) => (

            <FormItem>

              <FormLabel>Conta Contábil</FormLabel>

              <FormControl>

                <Combobox

                  value={field.value}

                  onChange={field.onChange}

                  options={contaContabilOptions}

                  placeholder="Selecione a conta contábil..."

                  loading={isLoadingContasContabeis}

                />

              </FormControl>

              <FormMessage />

            </FormItem>

          )}

        />

        

        <div className="grid grid-cols-2 gap-4">

            <FormField

              name="initialBalanceBRL"

              control={form.control}

              render={({ field }) => (

                <FormItem>

                  <FormLabel>Saldo Inicial (R$)</FormLabel>

                  <FormControl>

                                        <Input 

                                          type="number" 

                                          step="0.01" 

                                          readOnly={!!conta} 

                                          className={conta ? 'bg-muted text-muted-foreground' : ''}

                                          {...field} 

                                          onChange={e => {

                                              field.onChange(e);

                                              setLastEdited("BRL");

                                          }}

                                        />

                  </FormControl>

                  <FormMessage />

                </FormItem>

              )}

            />

            <FormField

              name="initialBalanceGold"

              control={form.control}

              render={({ field }) => (

                <FormItem>

                  <FormLabel>Saldo Inicial (Au)</FormLabel>

                  <FormControl>

                                        <Input 

                                          type="number" 

                                          step="0.0001" 

                                          readOnly={!!conta} 

                                          className={conta ? 'bg-muted text-muted-foreground' : ''}

                                          {...field} 

                                          onChange={e => {

                                              field.onChange(e);

                                              setLastEdited("GOLD");

                                          }}

                                        />

                  </FormControl>

                  <FormMessage />

                </FormItem>

              )}

            />

        </div>

        {conta && <FormDescription className="text-xs">O saldo inicial não pode ser editado. Para ajustar, crie uma transação.</FormDescription>}

        {marketData && !conta && (

            <p className="text-xs text-muted-foreground mt-1">

                Cotação ref.: 1g Au = {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(marketData.goldPriceBrl))}

            </p>

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

        

        {/* ... (isActive field) ... */}

        <FormField

          name="isActive"

          control={form.control}

          render={({ field }) => (

            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">

              <div className="space-y-0.5">

                <FormLabel className="text-base">Conta Ativa</FormLabel>

                <FormDescription>

                  Desative esta conta para que ela não apareça nos fechamentos e listagens por padrão.

                </FormDescription>

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