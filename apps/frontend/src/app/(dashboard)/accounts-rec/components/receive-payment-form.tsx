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
import { Checkbox } from "@/components/ui/checkbox";
import { AddPaymentDialog } from "./add-payment-dialog"; // Import the new dialog component

// Interfaces
import { SaleInstallment } from '@/types/sale';
interface ContaCorrente { id: string; nome: string; }
interface AccountRec {
  id: string;
  amount: number;
  amountPaid?: number;
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
  receivedAt: z.string().min(1, "A data do recebimento é obrigatória."),
  
  financialPayments: z.array(financialPaymentSchema).optional(),
  metalCreditPayments: z.array(metalCreditPaymentSchema).optional(),
  metalPayments: z.array(metalPaymentSchema).optional(),

  quotationBuyPrice: z.coerce.number().optional(),
  selectedInstallmentId: z.string().optional(),
  finalize: z.boolean().default(true), // Adicionado para controlar a finalização
}).superRefine((data, ctx) => {
  const hasFinancial = data.financialPayments && data.financialPayments.length > 0;
  const hasMetalCredit = data.metalCreditPayments && data.metalCreditPayments.length > 0;
  const hasMetal = data.metalPayments && data.metalPayments.length > 0;

  if (!hasFinancial && !hasMetalCredit && !hasMetal && !data.selectedInstallmentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Adicione pelo menos um método de pagamento.",
      path: ["financialPayments"], 
    });
  }

  if ((hasMetalCredit || hasMetal) && (!data.quotationBuyPrice || data.quotationBuyPrice <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A cotação é obrigatória para pagamentos em metal.",
      path: ["quotationBuyPrice"],
    });
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
  const formatGrams = (value: number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value || 0);

  const initialRemainingBRL = accountRec.amount - (accountRec.amountPaid || 0);
  const initialRemainingGold = accountRec.goldAmount - (accountRec.goldAmountPaid || 0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receivedAt: new Date().toISOString().split("T")[0],
      quotationBuyPrice: 0,
      financialPayments: [],
      metalCreditPayments: [],
      metalPayments: [],
      finalize: true,
    },
  });

  const { fields: financialFields, append: appendFinancial, remove: removeFinancial } = useFieldArray({ control: form.control, name: "financialPayments" });
  const { fields: metalCreditFields, append: appendMetalCredit, remove: removeMetalCredit } = useFieldArray({ control: form.control, name: "metalCreditPayments" });
  const { fields: metalFields, append: appendMetal, remove: removeMetal } = useFieldArray({ control: form.control, name: "metalPayments" });

  const selectedInstallmentId = form.watch("selectedInstallmentId");
  const receivedAt = form.watch("receivedAt");
  const quotationBuyPrice = form.watch("quotationBuyPrice");
  const watchedFinancialPayments = form.watch("financialPayments");
  const watchedMetalCreditPayments = form.watch("metalCreditPayments");
  const watchedMetalPayments = form.watch("metalPayments");

  const displayOriginalBRL = useMemo(() => {
    if (accountRec.goldAmount && quotationBuyPrice && quotationBuyPrice > 0) {
      return accountRec.goldAmount * quotationBuyPrice;
    }
    return accountRec.amount;
  }, [accountRec.goldAmount, accountRec.amount, quotationBuyPrice]);

  const displayAmountPaidBRL = useMemo(() => {
    if (accountRec.goldAmount && quotationBuyPrice && quotationBuyPrice > 0) {
      return (accountRec.goldAmountPaid || 0) * quotationBuyPrice;
    }
    return (accountRec.amountPaid || 0);
  }, [accountRec.goldAmount, accountRec.goldAmountPaid, accountRec.amountPaid, quotationBuyPrice]);

  const displayInitialRemainingBRL = useMemo(() => {
    return displayOriginalBRL - displayAmountPaidBRL;
  }, [displayOriginalBRL, displayAmountPaidBRL]);

  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);

  const handleSelectPaymentType = (type: 'financial' | 'metalCredit' | 'metal') => {
    if (selectedInstallmentId) return; // Prevent adding custom payments if an installment is selected

    switch (type) {
      case 'financial':
        appendFinancial({ amount: 0, contaCorrenteId: "", goldAmount: 0 });
        break;
      case 'metalCredit':
        appendMetalCredit({ metalCreditId: "", amountInGrams: 0 });
        break;
      case 'metal':
        appendMetal({ metalType: "AU", amountInGrams: 0, purity: 100 });
        break;
    }
  };

  // Lógica de cálculo do resumo do pagamento
  const paymentSummary = useMemo(() => {
    const financialTotal = watchedFinancialPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const currentMetalCreditTotalGrams = watchedMetalCreditPayments?.reduce((sum, p) => sum + (p.amountInGrams || 0), 0) || 0;
    const currentMetalTotalGrams = watchedMetalPayments?.reduce((sum, p) => sum + (p.amountInGrams || 0), 0) || 0;
    
    // Convert financial payments' gold equivalent to grams if quotation is available
    const financialGoldEquivalent = watchedFinancialPayments?.reduce((sum, p) => {
        const amount = p.amount || 0;
        return sum + (quotationBuyPrice && quotationBuyPrice > 0 ? amount / quotationBuyPrice : 0);
    }, 0) || 0;


    const totalPaidBRL = financialTotal + (currentMetalCreditTotalGrams + currentMetalTotalGrams) * (quotationBuyPrice || 0);
    const totalPaidGold = financialGoldEquivalent + currentMetalCreditTotalGrams + currentMetalTotalGrams;

    const remainingBRL = displayInitialRemainingBRL - totalPaidBRL; // Use the dynamic remaining BRL
    const remainingGold = initialRemainingGold - totalPaidGold;


    return { totalPaidBRL, remainingBRL, totalPaidGold, remainingGold };
  }, [watchedFinancialPayments, watchedMetalCreditPayments, watchedMetalPayments, quotationBuyPrice, displayInitialRemainingBRL, initialRemainingGold]);


  useEffect(() => {
    // Load data on mount
    api.get('/contas-correntes').then((res) => setContasCorrentes(res.data));
    if (accountRec.clientId) {
      api.get(`/metal-credits/client/${accountRec.clientId}`).then((res) => {
        setMetalCredits(
          res.data.map((mc: any) => ({
            id: mc.id,
            metalType: mc.metalType,
            grams: mc.grams,
            date: mc.date,
          })),
        );
      });
    }
  }, [accountRec.clientId]);

      useEffect(() => {
        if (receivedAt) {
          api.get(`/quotations/by-date?date=${receivedAt}&metal=AU`).then((res) => {
            if (res.data?.buyPrice) {
                 form.setValue("quotationBuyPrice", res.data.buyPrice, { shouldValidate: true });
            }
          });
        }
      }, [receivedAt, form]);
  useEffect(() => {
    watchedFinancialPayments?.forEach((payment, index) => {
      const goldValue = (payment.amount && quotationBuyPrice && quotationBuyPrice > 0) ? payment.amount / quotationBuyPrice : 0;
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
        form.setValue("metalCreditPayments", []);
        form.setValue("metalPayments", []);
        form.setValue("receivedAt", new Date(selected.dueDate).toISOString().split("T")[0]);
        form.clearErrors();
      }
    } else {
        // Clear financial payments if we deselect the installment, allowing for custom payment
        const financialAmount = form.getValues('financialPayments')?.[0]?.amount;
        const installmentAmount = accountRec.saleInstallments?.find(inst => inst.id === selectedInstallmentId)?.amount;
        if(financialAmount && installmentAmount && financialAmount === Number(installmentAmount) ){
             form.setValue("financialPayments", []);
        }
    }
  }, [selectedInstallmentId, accountRec.saleInstallments, form]);
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        receivedAt: data.receivedAt,
        quotation: data.quotationBuyPrice,
        finalize: data.finalize,
        financialPayments: data.financialPayments?.map(({ goldAmount, ...rest }) => rest), // Remove goldAmount
        metalCreditPayments: data.metalCreditPayments,
        metalPayments: data.metalPayments,
        installmentId: data.selectedInstallmentId,
      };
      
      await api.post(`/accounts-rec/${accountRec.id}/hybrid-receive`, payload);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Registrar recebimento para: <span className="font-medium">{accountRec.description}</span>
          {accountRec.sale?.pessoa?.name && ` (Cliente: ${accountRec.sale.pessoa.name})`}
        </p>

        <div className="space-y-2 rounded-md border bg-muted/20 p-4">
          <h4 className="font-medium text-sm">Resumo da Dívida</h4>
          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4">
            <span className="font-bold">Total Original:</span> <span>{formatCurrency(displayOriginalBRL)}</span>
            <span className="font-bold">Já Pago:</span> <span>{formatCurrency(displayAmountPaidBRL)}</span>
            <span className="font-bold text-primary">Restante Inicial:</span> <span className="font-bold text-primary">{formatCurrency(displayInitialRemainingBRL)}</span>
          </div>
        </div>
        


        {accountRec.saleInstallments && accountRec.saleInstallments.length > 0 && (
          <FormField name="selectedInstallmentId" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Pagar Parcela Específica (Opcional)</FormLabel>
              <Select onValueChange={(val) => field.onChange(val === "custom" ? "" : val)} value={field.value || "custom"}>
                <FormControl><SelectTrigger><SelectValue placeholder="Pagamento avulso" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="custom">Pagamento avulso</SelectItem>
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
        
        <div className="grid grid-cols-2 gap-4">
            <FormField name="receivedAt" control={form.control} render={({ field }) => (
                <FormItem className="w-fit"><FormLabel>Data do Recebimento</FormLabel>
                    <FormControl><DatePicker date={field.value ? new Date(field.value) : undefined} setDate={(date) => field.onChange(date ? formatISO(date, { representation: 'date' }) : '')} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField name="quotationBuyPrice" control={form.control} render={({ field }) => (
                <FormItem className="w-fit"><FormLabel>Cotação Ouro (R$/g)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>

        {financialFields.length > 0 && (
            <div className="space-y-2 pt-4">
              <h4 className="text-md font-semibold border-b pb-2">Pagamentos Financeiros (R$)</h4>
              <div className="space-y-4">
                {financialFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 rounded-md border p-4">
                    <div className="grid flex-1 gap-4 grid-cols-2">
                      <FormField control={form.control} name={`financialPayments.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`financialPayments.${index}.contaCorrenteId`} render={({ field }) => (<FormItem><FormLabel>Conta</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{contasCorrentes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormItem><FormLabel>Valor em Ouro (g)</FormLabel><FormControl><Input readOnly value={(quotationBuyPrice ? ((watchedFinancialPayments?.[index]?.amount || 0) / quotationBuyPrice) : 0).toFixed(4)} /></FormControl></FormItem>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFinancial(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
        )}

        {metalCreditFields.length > 0 && (
            <div className="space-y-2 pt-4">
              <h4 className="text-md font-semibold border-b pb-2">Pagamentos com Crédito de Metal (g)</h4>
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
                                    {mc.metalType} - {formatGrams(mc.grams)}g
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
                            <FormLabel>Quantidade a Utilizar (g)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.0001" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} />
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
              </div>
            </div>
        )}
        
        {metalFields.length > 0 && (
            <div className="space-y-2 pt-4">
              <h4 className="text-md font-semibold border-b pb-2">Pagamentos com Metal Físico (g)</h4>
              <div className="space-y-4">
                {metalFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 rounded-md border p-4">
                    <div className="grid flex-1 gap-4 grid-cols-3">
                      <FormField control={form.control} name={`metalPayments.${index}.metalType`} render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="AU">Ouro</SelectItem><SelectItem value="AG">Prata</SelectItem><SelectItem value="RH">Ródio</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`metalPayments.${index}.amountInGrams`} render={({ field }) => (<FormItem><FormLabel>Quantidade (g)</FormLabel><FormControl><Input type="number" step="0.0001" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`metalPayments.${index}.purity`} render={({ field }) => (<FormItem><FormLabel>Pureza (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMetal(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
        )}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddPaymentDialogOpen(true)}
          disabled={!!selectedInstallmentId}
          className="w-full mt-4"
        >
          Adicionar Pagamento
        </Button>
        
        {/* Payment Summary */}
        <div className="space-y-2 rounded-md border border-dashed border-green-500 bg-green-500/10 p-4">
          <h4 className="font-medium text-sm text-green-700">Resumo deste Pagamento</h4>
          <div className="text-sm grid grid-cols-2 gap-x-4">
            <span className="font-bold">Total Pago agora:</span> <span className="font-bold">{formatCurrency(paymentSummary.totalPaidBRL)}</span>
            <span className="font-bold text-primary">Saldo Final:</span> <span className={`font-bold ${paymentSummary.remainingBRL < 0 ? 'text-yellow-500' : 'text-primary'}`}>{formatCurrency(paymentSummary.remainingBRL)}</span>
          </div>
           {paymentSummary.remainingBRL < 0 && <p className="text-xs text-yellow-600">Este pagamento deixará um crédito de {formatCurrency(Math.abs(paymentSummary.remainingBRL))} para o cliente.</p>}
        </div>
        
        <FormField
          control={form.control}
          name="finalize"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Finalizar Dívida/Venda com este pagamento?
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Se desmarcado, a dívida permanecerá aberta mesmo que o valor seja totalmente pago.
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Salvando..." : "Confirmar Recebimento"}
        </Button>
      </form>

      <AddPaymentDialog
        isOpen={isAddPaymentDialogOpen}
        onOpenChange={setIsAddPaymentDialogOpen}
        onSelectPaymentType={handleSelectPaymentType}
      />
    </Form>
  );
}