"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
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
import { Trash2 } from 'lucide-react';

// Interfaces
import { SaleInstallment } from '@/types/sale';

interface ContaCorrente {
  id: string;
  nome: string;
}
interface AccountRec {
  id: string;
  amount: number;
  description: string;
  clientId?: string;
  goldAmount?: number;
  goldAmountPaid?: number;
  sale?: {
    pessoa?: { name: string };
    createdAt?: string;
  };
  saleInstallments?: SaleInstallment[];
  saleId?: string;
}
interface MetalCredit {
  id: string;
  metalType: string;
  grams: number;
  date: string;
}

interface ReceivePaymentFormProps {
  accountRec: AccountRec;
  onSave: () => void;
}

// Schema for a single payment entry in the form's state
const paymentSchema = z.object({
  contaCorrenteId: z.string().min(1, "A conta é obrigatória."),
  amount: z.coerce.number().min(0.01, "O valor deve ser no mínimo R$ 0,01."),
  goldAmount: z.coerce.number().optional(),
});

// Main form schema
const formSchema = z.object({
  paymentMethod: z.enum(["FINANCIAL", "METAL_CREDIT", "METAL"], { required_error: "Selecione um método de pagamento." }),
  receivedAt: z.string().optional(), // Optional at schema level, required in refine for FINANCIAL
  payments: z.array(paymentSchema).optional(),

  // Fields for other payment methods and for UI calculations
  metalCreditId: z.string().optional(),
  amountInGrams: z.coerce.number().optional(),
  purity: z.coerce.number().optional(),
  quotationBuyPrice: z.coerce.number().optional(), // For METAL/METAL_CREDIT and for UI calculation
  selectedInstallmentId: z.string().optional(),
  metalType: z.enum(['AU', 'AG', 'RH']).optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "FINANCIAL") {
    if (!data.receivedAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data do recebimento é obrigatória.", path: ["receivedAt"] });
    }
    if (!data.payments || data.payments.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adicione pelo menos um pagamento.", path: ["payments"] });
    }
  } else if (data.paymentMethod === "METAL_CREDIT") {
    if (!data.metalCreditId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o crédito de metal.", path: ["metalCreditId"] });
    if (!data.amountInGrams || data.amountInGrams <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A quantidade em gramas é obrigatória.", path: ["amountInGrams"] });
    if (!data.quotationBuyPrice || data.quotationBuyPrice <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O preço da cotação é obrigatório.", path: ["quotationBuyPrice"] });
  } else if (data.paymentMethod === "METAL") {
    if (!data.metalType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O tipo de metal é obrigatória.", path: ["metalType"] });
    if (!data.amountInGrams || data.amountInGrams <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A quantidade em gramas é obrigatória.", path: ["amountInGrams"] });
    if (!data.quotationBuyPrice || data.quotationBuyPrice <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A cotação é obrigatória.", path: ["quotationBuyPrice"] });
    if (!data.purity || data.purity <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A pureza é obrigatória.", path: ["purity"] });
  }
});


export function ReceivePaymentForm({
  accountRec: rawAccountRec,
  onSave,
}: ReceivePaymentFormProps) {
  const accountRec = useMemo(() => ({
    ...rawAccountRec,
    amount: Number(rawAccountRec.amount || 0),
    amountPaid: Number(rawAccountRec.amountPaid || 0),
    goldAmount: Number(rawAccountRec.goldAmount || 0),
    goldAmountPaid: Number(rawAccountRec.goldAmountPaid || 0),
  }), [rawAccountRec]);

  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [metalCredits, setMetalCredits] = useState<MetalCredit[]>([]);
  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const remainingBRL = accountRec.amount - accountRec.amountPaid;
  const remainingGold = accountRec.goldAmount - accountRec.goldAmountPaid;
  const isGoldBased = accountRec.goldAmount > 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "FINANCIAL",
      receivedAt: new Date().toISOString().split("T")[0],
      payments: [{
        amount: parseFloat(remainingBRL.toFixed(2)),
        contaCorrenteId: "",
        goldAmount: 0,
      }],
      quotationBuyPrice: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "payments" });

  const watchedPayments = form.watch("payments");
  const receivedAt = form.watch("receivedAt");
  const quotationBuyPrice = form.watch("quotationBuyPrice");
  const selectedPaymentMethod = form.watch("paymentMethod");
  const selectedInstallmentId = form.watch("selectedInstallmentId");

  // Effect to fetch quotation when the single date changes
  useEffect(() => {
    if (receivedAt && selectedPaymentMethod === 'FINANCIAL') {
      api.get(`/quotations/by-date?date=${receivedAt}&metal=AU`).then((res) => {
        if (res.data?.buyPrice) {
          form.setValue("quotationBuyPrice", res.data.buyPrice, { shouldValidate: true });
        }
      });
    }
  }, [receivedAt, selectedPaymentMethod, form]);

  // Effect to recalculate goldAmount for each payment when amounts or the global quotation change
  useEffect(() => {
    watchedPayments?.forEach((payment, index) => {
      const goldValue = (payment.amount && quotationBuyPrice > 0) ? payment.amount / quotationBuyPrice : 0;
      if (form.getValues(`payments.${index}.goldAmount`) !== goldValue) {
        form.setValue(`payments.${index}.goldAmount`, goldValue);
      }
    });
  }, [watchedPayments, quotationBuyPrice, form]);

  // Effect to update payment details when an installment is selected
  useEffect(() => {
    if (selectedInstallmentId && accountRec.saleInstallments) {
      const selectedInstallment = accountRec.saleInstallments.find(inst => inst.id === selectedInstallmentId);
      if (selectedInstallment) {
        form.setValue("payments", [{
          amount: parseFloat(Number(selectedInstallment.amount).toFixed(2)),
          contaCorrenteId: form.getValues("payments.0.contaCorrenteId") || "",
          goldAmount: 0, // Will be recalculated by the effect
        }]);
        form.setValue("receivedAt", new Date(selectedInstallment.dueDate).toISOString().split("T")[0]);
        form.clearErrors("payments");
      }
    }
  }, [selectedInstallmentId, accountRec.saleInstallments, form]);


  useEffect(() => {
    if (selectedPaymentMethod === "FINANCIAL") {
      api.get("/contas-correntes").then((res) => setContasCorrentes(res.data));
    } else if (selectedPaymentMethod === "METAL_CREDIT" && accountRec.clientId) {
      api.get(`/metal-credits/client/${accountRec.clientId}`).then((res) => {
        setMetalCredits(res.data.map((mc: any) => ({ id: mc._id.value, metalType: mc.props.metalType, grams: Number(mc.props.grams), date: mc.props.date })));
      });
    }
  }, [selectedPaymentMethod, accountRec.clientId]);


  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      let url: string;
      let payload: any;
      
      const isInstallmentPayment = accountRec.saleId && data.selectedInstallmentId;

      if (data.paymentMethod === "FINANCIAL") {
        if (isInstallmentPayment) {
          url = `/sales/${accountRec.saleId}/installments/${data.selectedInstallmentId}/receive`;
          payload = {
            paymentMethod: data.paymentMethod,
            contaCorrenteId: data.payments?.[0]?.contaCorrenteId,
            amountReceived: data.payments?.[0]?.amount,
            receivedAt: data.receivedAt,
            quotationBuyPrice: data.quotationBuyPrice, // This DTO uses this field name for the quotation
          };
        } else {
          url = `/accounts-rec/${accountRec.id}/receive`;
          payload = {
            receivedAt: data.receivedAt,
            payments: data.payments,
          };
        }
      } else {
        // Logic for METAL and METAL_CREDIT (always flat payload)
        payload = {
            paymentMethod: data.paymentMethod,
            metalCreditId: data.metalCreditId,
            amountInGrams: data.amountInGrams,
            customBuyPrice: data.quotationBuyPrice, // For metal credit
            quotation: data.quotationBuyPrice, // For metal payment
            purity: data.purity,
            metalType: data.metalType,
        };
        if (isInstallmentPayment) {
            url = `/sales/${accountRec.saleId}/installments/${data.selectedInstallmentId}/receive`;
        } else {
            // These endpoints have different names but similar flat payloads
            if (data.paymentMethod === 'METAL_CREDIT') {
                url = `/accounts-rec/${accountRec.id}/pay-with-metal-credit`;
            } else { // METAL
                url = `/accounts-rec/${accountRec.id}/pay-with-metal`;
            }
        }
      }
      
      await api.patch(url, payload);
      toast.success("Recebimento registrado com sucesso!");
      onSave();
    } catch (err: any) {
        const errorMessages = err.response?.data?.message;
        const displayMessage = Array.isArray(errorMessages) ? errorMessages.join(', ') : (errorMessages || "Ocorreu um erro.");
        toast.error(displayMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Registrar recebimento para:{" "}
          <span className="font-medium">{accountRec.description}</span>
          {accountRec.sale?.pessoa?.name && (
            <span className="font-medium"> (Cliente: {accountRec.sale.pessoa.name})</span>
          )}
        </p>

        <div className="space-y-2 rounded-md border bg-muted/20 p-4">
          <h4 className="font-medium text-sm">Resumo da Dívida</h4>
          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4">
            <span className="font-bold">Total:</span> <span>{formatCurrency(accountRec.amount)}</span>
            <span className="font-bold">Pago:</span> <span>{formatCurrency(accountRec.amountPaid || 0)}</span>
            <span className="font-bold text-primary">Restante:</span> <span className="font-bold text-primary">{formatCurrency(remainingBRL)}</span>
          </div>
        </div>

        {accountRec.saleInstallments && accountRec.saleInstallments.length > 0 && (
          <FormField
            name="selectedInstallmentId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pagar Parcela Específica</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Não (pagar valor avulso)" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="">Não (pagar valor avulso)</SelectItem>
                    {accountRec.saleInstallments
                      .filter(inst => inst.status === 'PENDING')
                      .map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          Parcela #{inst.installmentNumber} - {formatCurrency(Number(inst.amount))} (Venc. {new Date(inst.dueDate).toLocaleDateString()})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          name="paymentMethod" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="FINANCIAL">Dinheiro / Transferência</SelectItem>
                  <SelectItem value="METAL_CREDIT">Crédito de Metal</SelectItem>
                  <SelectItem value="METAL">Receber em Metal</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedPaymentMethod === "FINANCIAL" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField name="receivedAt" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Data do Recebimento</FormLabel>
                        <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField name="quotationBuyPrice" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cotação (R$/g)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            {fields.map((field, index) => {
               const payment = watchedPayments?.[index];
               const goldValue = payment?.goldAmount || 0;

              return (
              <div key={field.id} className="flex items-start gap-2 rounded-md border p-4">
                <div className="grid flex-1 gap-4">
                  <FormField control={form.control} name={`payments.${index}.amount`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name={`payments.${index}.contaCorrenteId`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {contasCorrentes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Valor em Ouro (g) <span className="text-xs text-muted-foreground">(calculado)</span></FormLabel>
                    <FormControl><Input type="number" readOnly value={goldValue.toFixed(4)} /></FormControl>
                  </FormItem>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="mt-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )})}
            {!selectedInstallmentId && (
                <Button type="button" variant="outline" size="sm" onClick={() => append({ amount: 0, contaCorrenteId: "", goldAmount: 0 })}>
                    Adicionar Pagamento
                </Button>
            )}
          </div>
        )}

        {(selectedPaymentMethod === "METAL_CREDIT" || selectedPaymentMethod === "METAL") && (
          <div className="grid grid-cols-2 gap-4">
            {selectedPaymentMethod === "METAL" && <FormField name="metalType" control={form.control} render={({ field }) => (<FormItem><FormLabel>Tipo de Metal</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="AU">Ouro (AU)</SelectItem><SelectItem value="AG">Prata (AG)</SelectItem><SelectItem value="RH">Ródio (RH)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />}
            {selectedPaymentMethod === "METAL_CREDIT" && <FormField name="metalCreditId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Crédito de Metal</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{metalCredits.map((mc) => (<SelectItem key={mc.id} value={mc.id}>{mc.metalType} - {mc.grams.toFixed(4)}g ({mc.date})</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />}
            <FormField name="amountInGrams" control={form.control} render={({ field }) => (<FormItem><FormLabel>Quantidade em Gramas</FormLabel><FormControl><Input type="number" step="0.000001" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="quotationBuyPrice" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cotação (R$/g)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
            {selectedPaymentMethod === "METAL" && <FormField name="purity" control={form.control} render={({ field }) => (<FormItem><FormLabel>Pureza (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />}
          </div>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Salvando..." : "Confirmar Recebimento"}
        </Button>
      </form>
    </Form>
  );
}