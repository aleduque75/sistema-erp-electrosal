"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  sale?: { 
    pessoa?: { name: string }; 
    createdAt?: string; 
    observation?: string | null;
  };
  saleInstallments?: SaleInstallment[];
  saleId?: string;
}
interface MetalCredit { id: string; metalType: string; grams: number; date: string; }

interface ReceivePaymentFormProps { accountRec: AccountRec; onSave: () => void; }

// Schemas for individual payment types
const financialPaymentSchema = z.object({
  contaCorrenteId: z.string().min(1, "A conta é obrigatória."),
  amount: z.string().transform(Number).pipe(z.number().min(0.01, "O valor deve ser no mínimo R$ 0,01.")),
  goldAmount: z.string().optional().transform(s => s ? Number(s) : undefined),
  receivedAt: z.string().optional(),
  quotation: z.coerce.number().optional(),
});

const metalCreditPaymentSchema = z.object({
  metalCreditId: z.string().min(1, "Selecione o crédito de metal."),
  amountInGrams: z.string().transform(Number).pipe(z.number().min(0.000001, "A quantidade em gramas é obrigatória.")),
  receivedAt: z.string().optional(),
  quotation: z.string().optional().transform(s => s ? Number(s) : undefined),
});

const metalPaymentSchema = z.object({
  metalType: z.enum(['AU', 'AG', 'RH'], { message: "O tipo de metal é obrigatório." }),
  amountInGrams: z.string().transform(Number).pipe(z.number().min(0.000001, "A quantidade em gramas é obrigatória.")),
  purity: z.string().transform(Number).pipe(z.number().min(0.01, "A pureza é obrigatória.")),
  receivedAt: z.string().optional(),
  quotation: z.string().optional().transform(s => s ? Number(s) : undefined),
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

  // Validação: se houver pagamento financeiro e a dívida tiver componente em ouro (verificado via lógica ou contexto, aqui simplificado),
  // ou se houver metal envolvido, precisamos de cotação.
  // A cotação pode estar no nível superior ou no item.
  // A validação completa é complexa no Zod sem contexto externo, mas mantemos a básica.
  // Se não tiver cotação global, verifica se todos os itens que precisam têm cotação individual.
  
  if ((hasMetalCredit || hasMetal)) {
      // Check global quotation
      const globalQuotation = data.quotationBuyPrice;
      if (!globalQuotation || globalQuotation <= 0) {
          // Check if ALL items have individual quotation
          const allMetalCreditsHaveQuotation = data.metalCreditPayments?.every(p => p.quotation && p.quotation > 0);
          const allMetalsHaveQuotation = data.metalPayments?.every(p => p.quotation && p.quotation > 0);
          
          if (!allMetalCreditsHaveQuotation || !allMetalsHaveQuotation) {
               ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "A cotação é obrigatória (informe a geral ou em cada item).",
                path: ["quotationBuyPrice"],
              });
          }
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
  const formatGrams = (value: number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value || 0);

  const initialRemainingBRL = accountRec.amount - (accountRec.amountPaid || 0);
  const initialRemainingGold = accountRec.goldAmount ? (accountRec.goldAmount - (accountRec.goldAmountPaid || 0)) : 0;

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
  
  const watchedFinancialPayments = useWatch({ control: form.control, name: "financialPayments" });
  const watchedMetalCreditPayments = useWatch({ control: form.control, name: "metalCreditPayments" });
  const watchedMetalPayments = useWatch({ control: form.control, name: "metalPayments" });

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
    const currentReceivedAt = form.getValues('receivedAt');
    const currentQuotation = form.getValues('quotationBuyPrice');

    switch (type) {
      case 'financial':
        appendFinancial({ amount: 0, contaCorrenteId: "", goldAmount: 0, receivedAt: currentReceivedAt, quotation: currentQuotation });
        break;
      case 'metalCredit':
        appendMetalCredit({ metalCreditId: "", amountInGrams: 0, receivedAt: currentReceivedAt, quotation: currentQuotation });
        break;
      case 'metal':
        appendMetal({ metalType: "AU", amountInGrams: 0, purity: 100, receivedAt: currentReceivedAt, quotation: currentQuotation });
        break;
    }
  };

  // Lógica de cálculo do resumo do pagamento
  const paymentSummary = useMemo(() => {
    const defaultQuotation = quotationBuyPrice || 0;

    let totalPaidBRL = 0;
    let totalPaidGold = 0;

    watchedFinancialPayments?.forEach(p => {
        const q = (p.quotation && p.quotation > 0) ? p.quotation : defaultQuotation;
        const amount = p.amount || 0;
        totalPaidBRL += amount;
        if (q > 0) {
            totalPaidGold += amount / q;
        }
    });

    watchedMetalCreditPayments?.forEach(p => {
        const q = (p.quotation && p.quotation > 0) ? p.quotation : defaultQuotation;
        const grams = p.amountInGrams || 0;
        totalPaidGold += grams;
        totalPaidBRL += grams * q;
    });

    watchedMetalPayments?.forEach(p => {
         const q = (p.quotation && p.quotation > 0) ? p.quotation : defaultQuotation;
         const grams = p.amountInGrams || 0;
         totalPaidGold += grams;
         totalPaidBRL += grams * q;
    });

    // Ensure we are using the numbers for calculation to avoid string concatenation issues if form values are strings
    totalPaidBRL = Number(totalPaidBRL);
    totalPaidGold = Number(totalPaidGold);

    const remainingBRL = displayInitialRemainingBRL - totalPaidBRL;
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
                 // Update global quotation
                 form.setValue("quotationBuyPrice", res.data.buyPrice, { shouldValidate: true });
            }
          });
        }
      }, [receivedAt, form]);
  
  // Removed useEffect for goldAmount sync as we calculate it on the fly now

  useEffect(() => {
    if (selectedInstallmentId && accountRec.saleInstallments) {
      const selected = accountRec.saleInstallments.find(inst => inst.id === selectedInstallmentId);
      if (selected) {
        const dueDate = new Date(selected.dueDate).toISOString().split("T")[0];
        form.setValue("financialPayments", [{
          amount: parseFloat(Number(selected.amount).toFixed(2)),
          contaCorrenteId: form.getValues("financialPayments.0.contaCorrenteId") || "",
          goldAmount: 0,
          receivedAt: dueDate,
          quotation: form.getValues("quotationBuyPrice"),
        }]);
        form.setValue("metalCreditPayments", []);
        form.setValue("metalPayments", []);
        form.setValue("receivedAt", dueDate);
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
        installmentId: data.selectedInstallmentId || undefined,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT") {
        e.preventDefault();
      }
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        onKeyDown={handleKeyDown}
        className="space-y-6"
      >
        <div className="text-sm text-muted-foreground">
          <p>Registrar recebimento para: <span className="font-medium">{accountRec.description}</span></p>
          <div className="flex gap-2 mt-1">
            {accountRec.sale?.pessoa?.name && <Badge variant="outline">Cliente: {accountRec.sale.pessoa.name}</Badge>}
            {accountRec.sale?.createdAt && (
              <Badge variant="outline">
                Data do Pedido: {new Date(accountRec.sale.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 rounded-md border bg-muted/20 p-4">
          <h4 className="font-medium text-sm">Resumo da Dívida</h4>
          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4">
            <span className="font-bold">Total Original:</span> <span>{formatCurrency(displayOriginalBRL)}</span>
            <span className="font-bold">Já Pago:</span> <span>{formatCurrency(displayAmountPaidBRL)}</span>
            <span className="font-bold text-primary">Restante Inicial:</span> <span className="font-bold text-primary">{formatCurrency(displayInitialRemainingBRL)}</span>
            {accountRec.goldAmount && (
                <>
                <span className="font-bold text-yellow-600 mt-2">Total Ouro:</span> <span className="mt-2 text-yellow-600">{formatGrams(accountRec.goldAmount)}g</span>
                 <span className="font-bold text-yellow-600">Restante Ouro:</span> <span className="text-yellow-600">{formatGrams(initialRemainingGold)}g</span>
                </>
            )}
          </div>
        </div>
        
        {accountRec.sale?.observation && (
          <div className="space-y-1 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4">
            <h4 className="font-medium text-sm text-yellow-600 dark:text-yellow-500">Observações do Pedido</h4>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">{accountRec.sale.observation}</p>
          </div>
        )}


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
        
        <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4">
            <div className="col-span-2 text-sm font-medium text-gray-500 mb-2">Padrões para novos itens (opcional)</div>
            <FormField name="receivedAt" control={form.control} render={({ field }) => (
                <FormItem className="w-fit"><FormLabel>Data Padrão</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField name="quotationBuyPrice" control={form.control} render={({ field }) => (
                <FormItem className="w-fit"><FormLabel>Cotação Padrão (R$/g)</FormLabel>
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
                  <div key={field.id} className="flex flex-col gap-4 rounded-md border p-4 bg-muted/20">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name={`financialPayments.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`financialPayments.${index}.contaCorrenteId`} render={({ field }) => (<FormItem><FormLabel>Conta</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{contasCorrentes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 items-end">
                       <FormField control={form.control} name={`financialPayments.${index}.receivedAt`} render={({ field }) => (<FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name={`financialPayments.${index}.quotation`} render={({ field }) => (<FormItem><FormLabel>Cotação (R$/g)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                       <FormItem><FormLabel>Valor em Ouro (g)</FormLabel><FormControl><Input readOnly value={(() => {
                           const payment = watchedFinancialPayments?.[index];
                           const amt = payment?.amount || 0;
                           const q = (payment?.quotation && payment.quotation > 0) ? payment.quotation : (quotationBuyPrice || 0);
                           return (amt && q > 0) ? (amt / q).toFixed(4) : "0.0000";
                       })()} /></FormControl></FormItem>
                    </div>

                    <div className="flex justify-end">
                         <Button type="button" variant="destructive" size="sm" onClick={() => removeFinancial(index)}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>
                    </div>
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
                  <div key={field.id} className="flex flex-col gap-4 rounded-md border p-4 bg-muted/20">
                    <div className="grid grid-cols-2 gap-4">
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
                            <FormLabel>Quantidade (g)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.0001" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <FormField control={form.control} name={`metalCreditPayments.${index}.receivedAt`} render={({ field }) => (<FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name={`metalCreditPayments.${index}.quotation`} render={({ field }) => (<FormItem><FormLabel>Cotação (R$/g)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="flex justify-end">
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeMetalCredit(index)}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>
                    </div>
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
                  <div key={field.id} className="flex flex-col gap-4 rounded-md border p-4 bg-muted/20">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={form.control} name={`metalPayments.${index}.metalType`} render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="AU">Ouro</SelectItem><SelectItem value="AG">Prata</SelectItem><SelectItem value="RH">Ródio</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`metalPayments.${index}.amountInGrams`} render={({ field }) => (<FormItem><FormLabel>Quantidade (g)</FormLabel><FormControl><Input type="number" step="0.0001" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`metalPayments.${index}.purity`} render={({ field }) => (<FormItem><FormLabel>Pureza (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                       <FormField control={form.control} name={`metalPayments.${index}.receivedAt`} render={({ field }) => (<FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name={`metalPayments.${index}.quotation`} render={({ field }) => (<FormItem><FormLabel>Cotação (R$/g)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="flex justify-end">
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeMetal(index)}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>
                    </div>
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
          <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
            <span className="font-bold">Total Pago agora (R$):</span> <span className="font-bold">{formatCurrency(paymentSummary.totalPaidBRL)}</span>
            <span className="font-bold text-primary">Saldo Final Estimado (R$):</span> <span className={`font-bold ${paymentSummary.remainingBRL < 0 ? 'text-yellow-500' : 'text-primary'}`}>{formatCurrency(paymentSummary.remainingBRL)}</span>
            
            <span className="font-bold text-yellow-700">Total Pago agora (Au):</span> <span className="font-bold text-yellow-700">{formatGrams(paymentSummary.totalPaidGold)}g</span>
             <span className="font-bold text-yellow-700">Saldo Final (Au):</span> <span className={`font-bold text-yellow-700`}>{formatGrams(paymentSummary.remainingGold)}g</span>
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