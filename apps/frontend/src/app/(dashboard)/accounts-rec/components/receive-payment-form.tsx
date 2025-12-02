"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import { formatISO } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";

// Interfaces
import { SaleInstallment } from '@/types/sale';
interface ContaCorrente { id: string; nome: string; }
interface AccountRec {
  id: string;
  amount: number;
  description: string;
  clientId?: string;
  goldAmount?: number;
  goldAmountPaid?: number;
  sale?: { pessoa?: { name: string }; createdAt?: string; };
  saleInstallments?: SaleInstallment[];
  saleId?: string;
}
interface MetalCredit { id: string; metalType: string; grams: number; date: string; }

interface ReceivePaymentFormProps { accountRec: AccountRec; onSave: () => void; }

// Schemas for individual payment types
const financialPaymentSchema = z.object({
  contaCorrenteId: z.string().min(1, "A conta é obrigatória."),
  amount: z.coerce.number().min(0.01, "O valor deve ser no mínimo R$ 0,01."),
  goldAmount: z.coerce.number().optional(),
});

const metalCreditPaymentSchema = z.object({
  metalCreditId: z.string().min(1, "Selecione o crédito de metal."),
  amountInGrams: z.coerce.number().min(0.000001, "A quantidade em gramas é obrigatória."),
});

const metalPaymentSchema = z.object({
  metalType: z.enum(['AU', 'AG', 'RH'], { required_error: "O tipo de metal é obrigatório." }),
  amountInGrams: z.coerce.number().min(0.000001, "A quantidade em gramas é obrigatória."),
  purity: z.coerce.number().min(0.01, "A pureza é obrigatória."),
});

// Main form schema
const formSchema = z.object({
  paymentMethod: z.enum(["FINANCIAL", "METAL_CREDIT", "METAL"], { required_error: "Selecione um método de pagamento." }),
  receivedAt: z.string().min(1, "A data do recebimento é obrigatória."),
  
  financialPayments: z.array(financialPaymentSchema).optional(),
  metalCreditPayments: z.array(metalCreditPaymentSchema).optional(),
  metalPayments: z.array(metalPaymentSchema).optional(),

  quotationBuyPrice: z.coerce.number().optional(),
  selectedInstallmentId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "FINANCIAL" && (!data.financialPayments || data.financialPayments.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adicione pelo menos um pagamento financeiro.", path: ["financialPayments"] });
  } else if (data.paymentMethod === "METAL_CREDIT") {
    if (!data.metalCreditPayments || data.metalCreditPayments.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adicione pelo menos um pagamento com crédito de metal.", path: ["metalCreditPayments"] });
    }
    if (!data.quotationBuyPrice || data.quotationBuyPrice <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O preço da cotação é obrigatório.", path: ["quotationBuyPrice"] });
    }
  } else if (data.paymentMethod === "METAL") {
    if (!data.metalPayments || data.metalPayments.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adicione pelo menos um pagamento em metal.", path: ["metalPayments"] });
    }
    if (!data.quotationBuyPrice || data.quotationBuyPrice <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A cotação é obrigatória.", path: ["quotationBuyPrice"] });
    }
  }
});

export function ReceivePaymentForm({ accountRec: rawAccountRec, onSave }: ReceivePaymentFormProps) {
  const accountRec = useMemo(() => ({
    ...rawAccountRec,
    amount: Number(rawAccountRec.amount || 0),
    amountPaid: Number(rawAccountRec.amountPaid || 0),
  }), [rawAccountRec]);

  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [metalCredits, setMetalCredits] = useState<MetalCredit[]>([]);
  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const remainingBRL = accountRec.amount - accountRec.amountPaid;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "FINANCIAL",
      receivedAt: new Date().toISOString().split("T")[0],
      quotationBuyPrice: 0,
      financialPayments: [],
      metalCreditPayments: [],
      metalPayments: [],
    },
  });

  const { fields: financialFields, append: appendFinancial, remove: removeFinancial } = useFieldArray({ control: form.control, name: "financialPayments" });
  const { fields: metalCreditFields, append: appendMetalCredit, remove: removeMetalCredit } = useFieldArray({ control: form.control, name: "metalCreditPayments" });
  const { fields: metalFields, append: appendMetal, remove: removeMetal } = useFieldArray({ control: form.control, name: "metalPayments" });

  const selectedPaymentMethod = form.watch("paymentMethod");
  const selectedInstallmentId = form.watch("selectedInstallmentId");
  const receivedAt = form.watch("receivedAt");
  const quotationBuyPrice = form.watch("quotationBuyPrice");
  const watchedFinancialPayments = form.watch("financialPayments");

  useEffect(() => {
    if (selectedPaymentMethod === "FINANCIAL" && financialFields.length === 0) {
      appendFinancial({ amount: parseFloat(remainingBRL.toFixed(2)), contaCorrenteId: "", goldAmount: 0 });
    }
  }, [selectedPaymentMethod, financialFields, appendFinancial, remainingBRL]);

  useEffect(() => {
    if (receivedAt && selectedPaymentMethod === 'FINANCIAL') {
      api.get(`/quotations/by-date?date=${receivedAt}&metal=AU`).then((res) => {
        if (res.data?.buyPrice) form.setValue("quotationBuyPrice", res.data.buyPrice, { shouldValidate: true });
      });
    }
  }, [receivedAt, selectedPaymentMethod, form]);

  useEffect(() => {
    if (selectedPaymentMethod === 'METAL_CREDIT' && metalCreditFields.length === 0) {
      appendMetalCredit({ metalCreditId: '', amountInGrams: 0 });
    }
  }, [selectedPaymentMethod, metalCreditFields, appendMetalCredit]);

  useEffect(() => {
    watchedFinancialPayments?.forEach((payment, index) => {
      const goldValue = (payment.amount && quotationBuyPrice > 0) ? payment.amount / quotationBuyPrice : 0;
      if (form.getValues(`financialPayments.${index}.goldAmount`) !== goldValue) {
        form.setValue(`financialPayments.${index}.goldAmount`, goldValue);
      }
    });
  }, [watchedFinancialPayments, quotationBuyPrice, form]);

  useEffect(() => {
    if (selectedInstallmentId && accountRec.saleInstallments) {
      const selected = accountRec.saleInstallments.find(inst => inst.id === selectedInstallmentId);
      if (selected) {
        form.setValue("financialPayments", [{
          amount: parseFloat(Number(selected.amount).toFixed(2)),
          contaCorrenteId: form.getValues("financialPayments.0.contaCorrenteId") || "",
          goldAmount: 0,
        }]);
        form.setValue("receivedAt", new Date(selected.dueDate).toISOString().split("T")[0]);
        form.clearErrors("financialPayments");
      }
    }
  }, [selectedInstallmentId, accountRec.saleInstallments, form]);

  useEffect(() => {
    if (selectedPaymentMethod === 'FINANCIAL') {
      api.get('/contas-correntes').then((res) => setContasCorrentes(res.data));
    } else if (selectedPaymentMethod === 'METAL_CREDIT' && accountRec.clientId) {
      api.get(`/metal-credits/client/${accountRec.clientId}`).then((res) => {
        setMetalCredits(
          res.data.map((mc: any) => ({
            id: mc.id.value,
            metalType: mc.props.metalType,
            grams: mc.props.grams,
            date: mc.props.date,
          })),
        );
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
            contaCorrenteId: data.financialPayments?.[0]?.contaCorrenteId,
            amountReceived: data.financialPayments?.[0]?.amount,
            receivedAt: data.receivedAt,
            quotationBuyPrice: data.quotationBuyPrice,
          };
        } else {
          url = `/accounts-rec/${accountRec.id}/receive`;
          payload = { receivedAt: data.receivedAt, payments: data.financialPayments };
        }
      } else if (data.paymentMethod === "METAL_CREDIT") {
        url = `/accounts-rec/${accountRec.id}/pay-with-metal-credit-multiple`;
        payload = {
          payments: data.metalCreditPayments,
          customBuyPrice: data.quotationBuyPrice,
          receivedAt: data.receivedAt,
        };
      } else { // METAL
        url = `/accounts-rec/${accountRec.id}/pay-with-metal-multiple`;
        payload = {
          payments: data.metalPayments,
          quotation: data.quotationBuyPrice,
          receivedAt: data.receivedAt,
        };
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
          Registrar recebimento para: <span className="font-medium">{accountRec.description}</span>
          {accountRec.sale?.pessoa?.name && ` (Cliente: ${accountRec.sale.pessoa.name})`}
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
          <FormField name="selectedInstallmentId" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Pagar Parcela Específica</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl><SelectTrigger><SelectValue placeholder="Não (pagar valor avulso)" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="">Não (pagar valor avulso)</SelectItem>
                  {accountRec.saleInstallments.filter(inst => inst.status === 'PENDING').map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>
                      Parcela #{inst.installmentNumber} - {formatCurrency(Number(inst.amount))} (Venc. {new Date(inst.dueDate).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField name="paymentMethod" control={form.control} render={({ field }) => (
          <FormItem><FormLabel>Método de Pagamento</FormLabel>
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
        )} />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField name="receivedAt" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Data do Recebimento</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            {(selectedPaymentMethod === 'METAL' || selectedPaymentMethod === 'METAL_CREDIT' || (selectedPaymentMethod === 'FINANCIAL' && watchedFinancialPayments && watchedFinancialPayments.length > 0)) && (
                <FormField name="quotationBuyPrice" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Cotação (R$/g)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            )}
        </div>

        {selectedPaymentMethod === "FINANCIAL" && (
          <div className="space-y-4">
            {financialFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2 rounded-md border p-4">
                <div className="grid flex-1 gap-4 grid-cols-2">
                  <FormField control={form.control} name={`financialPayments.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name={`financialPayments.${index}.contaCorrenteId`} render={({ field }) => (<FormItem><FormLabel>Conta</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{contasCorrentes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormItem><FormLabel>Valor em Ouro (g)</FormLabel><FormControl><Input readOnly value={((watchedFinancialPayments?.[index]?.amount || 0) / (quotationBuyPrice || 1)).toFixed(4)} /></FormControl></FormItem>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeFinancial(index)} disabled={financialFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            {!selectedInstallmentId && <Button type="button" variant="outline" size="sm" onClick={() => appendFinancial({ amount: 0, contaCorrenteId: "", goldAmount: 0 })}>Adicionar Pagamento</Button>}
          </div>
        )}

        {selectedPaymentMethod === "METAL_CREDIT" && (
          <div className="space-y-4">
            {metalCreditFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2 rounded-md border p-4">
                <div className="grid flex-1 gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`metalCreditPayments.${index}.metalCreditId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crédito de Metal</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {metalCredits.map((mc) => (
                              <SelectItem key={mc.id} value={mc.id}>
                                {mc.metalType} - {Number(mc.grams).toFixed(4)}g
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
                    name={`metalCreditPayments.${index}.amountInGrams`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMetalCredit(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendMetalCredit({ metalCreditId: "", amountInGrams: 0 })
              }
            >
              Adicionar Pagamento com Crédito
            </Button>
          </div>
        )}

        {selectedPaymentMethod === "METAL" && (
          <div className="space-y-4">
            {metalFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2 rounded-md border p-4">
                <div className="grid flex-1 gap-4 grid-cols-3">
                  <FormField control={form.control} name={`metalPayments.${index}.metalType`} render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="AU">Ouro</SelectItem><SelectItem value="AG">Prata</SelectItem><SelectItem value="RH">Ródio</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name={`metalPayments.${index}.amountInGrams`} render={({ field }) => (<FormItem><FormLabel>Quantidade (g)</FormLabel><FormControl><Input type="number" step="0.0001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name={`metalPayments.${index}.purity`} render={({ field }) => (<FormItem><FormLabel>Pureza (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeMetal(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendMetal({ metalType: "AU", amountInGrams: 0, purity: 100 })}>Adicionar Pagamento em Metal</Button>
          </div>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Salvando..." : "Confirmar Recebimento"}
        </Button>
      </form>
    </Form>
  );
}