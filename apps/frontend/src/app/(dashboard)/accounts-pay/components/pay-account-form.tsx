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
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface AccountPay {
  id: string;
  description: string;
  amount: number;
}

interface PureMetalLot {
  id: string;
  description: string;
  remainingGrams: number;
  metalType: string;
}

interface PayAccountFormProps {
  account: AccountPay;
  onSave: () => void;
}

const formSchema = z.discriminatedUnion("paymentMethod", [
  z.object({
    paymentMethod: z.literal("BRL"),
    paidAmount: z.coerce.number().positive("O valor deve ser maior que zero.").optional(),
    paidAt: z.string().min(1, "A data de pagamento é obrigatória."),
    contaCorrenteId: z.string().min(1, "A conta corrente é obrigatória."),
    generateNewBillForRemaining: z.boolean().optional(),
    quotation: z.coerce.number().optional(), // For BRL payments that might be converted to gold later
  }),
  z.object({
    paymentMethod: z.literal("METAL"),
    pureMetalLotId: z.string().min(1, "O lote de metal é obrigatório."),
    gramsToPay: z.coerce.number().positive("As gramas devem ser um valor positivo."),
    quotation: z.coerce.number().positive("A cotação é obrigatória."),
    generateNewBillForRemaining: z.boolean().optional(),
    paidAt: z.string().min(1, "A data de pagamento é obrigatória."),
  }),
]);

type FormValues = z.infer<typeof formSchema>;

export function PayAccountForm({ account, onSave }: PayAccountFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [contaCorrenteOptions, setContaCorrenteOptions] = useState<{ value: string; label: string }[]>([]);
  const [pureMetalLots, setPureMetalLots] = useState<PureMetalLot[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "BRL",
      paidAmount: account.amount,
      paidAt: new Date().toISOString().split("T")[0],
      generateNewBillForRemaining: true,
      contaCorrenteId: "",
    },
  });

  const { watch, setValue } = form;
  const paymentMethod = watch("paymentMethod");
  const watchPaidAt = watch("paidAt");
  const gramsToPay = watch("paymentMethod") === "METAL" ? watch("gramsToPay") : 0;
  const metalQuotation = watch("paymentMethod") === "METAL" ? watch("quotation") : 0;
  const paidInBRL = paymentMethod === 'METAL' ? gramsToPay * metalQuotation : watch('paidAmount');


  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get("/contas-correntes"),
      api.get(`/quotations/find-by-date?date=${watchPaidAt}&metal=AU`),
      api.get("/pure-metal-lots"),
    ]).then(([contasCorrentesRes, quotationRes, pureMetalLotsRes]) => {
      setContaCorrenteOptions(contasCorrentesRes.data.map((cc: any) => ({ value: cc.id, label: cc.nome })));
      setPureMetalLots(pureMetalLotsRes.data);

      if (paymentMethod === "BRL" && quotationRes.data) {
        setValue("quotation", quotationRes.data.buyPrice);
      }
    }).catch(() => {
      toast.error("Falha ao carregar dados iniciais.");
    }).finally(() => {
      setIsLoading(false);
    });
  }, [watchPaidAt, setValue, paymentMethod]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.paymentMethod === "BRL") {
        await api.post(`/accounts-pay/${account.id}/pay`, {
          paidAmount: data.paidAmount,
          paidAt: new Date(data.paidAt),
          contaCorrenteId: data.contaCorrenteId,
          generateNewBillForRemaining: data.generateNewBillForRemaining,
          quotation: data.quotation,
        });
      } else if (data.paymentMethod === "METAL") {
        await api.post(`/accounts-pay/${account.id}/pay-with-metal`, {
          pureMetalLotId: data.pureMetalLotId,
          gramsToPay: data.gramsToPay,
          quotation: data.quotation,
          generateNewBillForRemaining: data.generateNewBillForRemaining,
          paidAt: new Date(data.paidAt),
        });
      }
      toast.success("Pagamento registrado com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro ao registrar o pagamento.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">Conta a Pagar: {account.description}</p>
        <p className="font-bold">Valor Original: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</p>
        {paymentMethod === 'METAL' && <p className="text-sm text-blue-500">Valor Pago em R$: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidInBRL || 0)}</p>}

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Método de Pagamento</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="BRL" />
                    </FormControl>
                    <FormLabel className="font-normal">Dinheiro (Caixa/Banco)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="METAL" />
                    </FormControl>
                    <FormLabel className="font-normal">Metal</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {paymentMethod === "BRL" && (
          <>
            <FormField
              name="paidAmount"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Pagamento (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="contaCorrenteId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Corrente de Origem</FormLabel>
                  <FormControl>
                    <Combobox
                      options={contaCorrenteOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione uma conta"
                      searchPlaceholder="Buscar conta..."
                      emptyText="Nenhuma conta encontrada."
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {paymentMethod === "METAL" && (
          <>
            <FormField
              control={form.control}
              name="pureMetalLotId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lote de Metal Puro</FormLabel>
                   <Combobox
                      options={pureMetalLots.map(lot => ({ value: lot.id, label: `${lot.metalType} - ${lot.description} (${lot.remainingGrams.toFixed(4)}g)`}))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione um lote de metal"
                      searchPlaceholder="Buscar lote..."
                      emptyText="Nenhum lote encontrado."
                      disabled={isLoading}
                    />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gramsToPay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gramas a Pagar</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          name="paidAt"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Pagamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          name="quotation"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cotação do Dia (R$ por grama)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          name="generateNewBillForRemaining"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Gerar nova fatura para o restante (se for pagamento parcial)
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
            {form.formState.isSubmitting ? "Registrando..." : "Registrar Pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
