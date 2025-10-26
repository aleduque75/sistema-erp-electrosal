"use client";

import { useForm, Controller } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Interfaces
import { SaleInstallment } from '@/types/sale'; // Import SaleInstallment

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
  sale?: { // Adicionado para acesso ao cliente e data da venda
    pessoa?: { name: string };
    createdAt?: string;
  };
  saleInstallments?: SaleInstallment[]; // Add saleInstallments
  saleId?: string; // Add saleId
}
interface MetalCredit {
  id: string;
  metalType: string;
  grams: number;
  date: string;
}

interface Quotation {
  id: string;
  metal: string;
  buyPrice: number;
  date: string;
}

interface ReceivePaymentFormProps {
  accountRec: AccountRec;
  onSave: () => void;
}

const formSchema = z.object({
  paymentMethod: z.enum(["FINANCIAL", "METAL_CREDIT", "METAL"], { required_error: "Selecione um método de pagamento." }),
  contaCorrenteId: z.string().optional(),
  amountReceived: z.coerce
    .number()
    .positive("O valor recebido deve ser maior que zero.")
    .optional(),
  receivedAt: z.string().min(1, "A data é obrigatória.").optional(),
  metalCreditId: z.string().optional(),
  amountInGrams: z.coerce.number().optional(),
  quotationBuyPrice: z.coerce
    .number()
    .min(0.01, "O preço da cotação deve ser maior que zero."), // Campo único para o preço da cotação
  metalType: z.enum(["AU", "AG", "RH"]).optional(),
  purity: z.coerce.number().optional(),
  selectedInstallmentId: z.string().optional(), // Add this field
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "FINANCIAL" && data.selectedInstallmentId) {
    // If paying an installment financially, ensure amountReceived is for a specific installment
    // This will be handled by default value, but can add validation if needed
  }
  if (data.paymentMethod === "FINANCIAL") {
    if (!data.contaCorrenteId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione a conta de destino.",
        path: ["contaCorrenteId"],
      });
    }
    if (!data.amountReceived) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O valor recebido é obrigatório.",
        path: ["amountReceived"],
      });
    }
    if (!data.receivedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data do recebimento é obrigatória.",
        path: ["receivedAt"],
      });
    }
  } else if (data.paymentMethod === "METAL_CREDIT") {
    if (!data.metalCreditId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o crédito de metal.",
        path: ["metalCreditId"],
      });
    }
    if (!data.amountInGrams || data.amountInGrams <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A quantidade em gramas é obrigatória.",
        path: ["amountInGrams"],
      });
    }
    if (!data.quotationBuyPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O preço da cotação é obrigatório.",
        path: ["quotationBuyPrice"],
      });
    }
  } else if (data.paymentMethod === "METAL") {
    if (!data.metalType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O tipo de metal é obrigatório.",
        path: ["metalType"],
      });
    }
    if (!data.amountInGrams || data.amountInGrams <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A quantidade em gramas é obrigatória.",
        path: ["amountInGrams"],
      });
    }
    if (!data.quotationBuyPrice || data.quotationBuyPrice <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A cotação é obrigatória.",
        path: ["quotationBuyPrice"],
      });
    }
    if (!data.purity || data.purity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A pureza é obrigatória.",
        path: ["purity"],
      });
    }
  }
});

export function ReceivePaymentForm({
  accountRec: rawAccountRec, // Rename to avoid confusion
  onSave,
}: ReceivePaymentFormProps) {
  // Sanitize data on entry to ensure all relevant fields are numbers
  const accountRec = useMemo(() => ({
    ...rawAccountRec,
    amount: Number(rawAccountRec.amount || 0),
    amountPaid: Number(rawAccountRec.amountPaid || 0),
    goldAmount: Number(rawAccountRec.goldAmount || 0),
    goldAmountPaid: Number(rawAccountRec.goldAmountPaid || 0),
  }), [rawAccountRec]);

  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [metalCredits, setMetalCredits] = useState<MetalCredit[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  // Calculate remaining amounts
  const remainingBRL = accountRec.amount - accountRec.amountPaid;
  const remainingGold = accountRec.goldAmount - accountRec.goldAmountPaid;
  const isGoldBased = accountRec.goldAmount > 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "FINANCIAL",
      amountReceived: parseFloat(remainingBRL.toFixed(2)), // Default to remaining BRL amount
      receivedAt: accountRec.sale?.createdAt ? new Date(accountRec.sale.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      contaCorrenteId: "",
      amountInGrams: 0,
      metalCreditId: "",
      selectedInstallmentId: "", // Add this field
    },
  });

  const selectedInstallmentId = form.watch("selectedInstallmentId"); // Watch selected installment

  // Update amountReceived based on selected installment
  useEffect(() => {
    if (selectedInstallmentId && accountRec.saleInstallments) {
      const selectedInstallment = accountRec.saleInstallments.find(inst => inst.id === selectedInstallmentId);
      if (selectedInstallment) {
        form.setValue("amountReceived", parseFloat(Number(selectedInstallment.amount).toFixed(2)));
        form.clearErrors("amountReceived"); // Clear any previous errors on amountReceived
      }
    } else {
      // If no installment is selected or it's not an installment sale, default to remainingBRL
      form.setValue("amountReceived", parseFloat(remainingBRL.toFixed(2)));
    }
  }, [selectedInstallmentId, accountRec.saleInstallments, remainingBRL, form]);

  const selectedPaymentMethod = form.watch("paymentMethod");
  const selectedMetalCreditId = form.watch("metalCreditId");

  const selectedMetalCredit = metalCredits.find(mc => mc.id === selectedMetalCreditId);

  const selectedQuotationBuyPrice = form.watch("quotationBuyPrice");

  const maxGramsToApply = useMemo(() => {
    if (isGoldBased) {
      return remainingGold;
    } else {
      if (!selectedQuotationBuyPrice || selectedQuotationBuyPrice <= 0) return 0;
      return parseFloat((remainingBRL / selectedQuotationBuyPrice).toFixed(6));
    }
  }, [accountRec, selectedQuotationBuyPrice, isGoldBased, remainingBRL, remainingGold]);

  useEffect(() => {
    if (selectedPaymentMethod === "FINANCIAL") {
      api.get("/contas-correntes").then((res) => setContasCorrentes(res.data));
    } else if (selectedPaymentMethod === "METAL_CREDIT" && accountRec.clientId) {
      api.get(`/metal-credits/client/${accountRec.clientId}`).then((res) => {
        setMetalCredits(res.data.map((mc: any) => ({
          id: mc._id.value,
          metalType: mc.props.metalType,
          grams: Number(mc.props.grams),
          date: mc.props.date,
        })));
      });
      api.get("/quotations?metalType=AU,AG").then((res) => {
        const fetchedQuotations = res.data.map(q => ({ ...q, buyPrice: Number(q.buyPrice) }));
        setQuotations(fetchedQuotations);
        if (fetchedQuotations.length > 0) {
          const sortedQuotations = fetchedQuotations
            .filter(q => q.metal === "AU" && new Date(q.date) <= new Date())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const mostRecentAuQuotation = sortedQuotations[0];
          if (mostRecentAuQuotation) {
            form.setValue("quotationBuyPrice", mostRecentAuQuotation.buyPrice);
          }
        }
      });
    }
  }, [selectedPaymentMethod, accountRec.clientId, form]);

  useEffect(() => {
    if ((selectedPaymentMethod === "METAL_CREDIT" || selectedPaymentMethod === "METAL") && maxGramsToApply > 0) {
      form.setValue("amountInGrams", parseFloat(maxGramsToApply.toFixed(6)));
    }
  }, [maxGramsToApply, selectedPaymentMethod, form]);

  const [goldValue, setGoldValue] = useState<number>(0);

  const receivedAt = form.watch("receivedAt");
  const amountReceived = form.watch("amountReceived");
  const quotationBuyPrice = form.watch("quotationBuyPrice");

  useEffect(() => {
    if (receivedAt) {
      api.get(`/quotations/by-date?date=${receivedAt}&metal=AU`).then((res) => {
        if (res.data) {
          form.setValue("quotationBuyPrice", res.data.buyPrice);
        }
      });
    }
  }, [receivedAt, form]);

  useEffect(() => {
    if (amountReceived && quotationBuyPrice) {
      setGoldValue(amountReceived / quotationBuyPrice);
    }
  }, [amountReceived, quotationBuyPrice]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      let response: any;
      const payload: any = {
        paymentMethod: data.paymentMethod,
        receivedAt: data.receivedAt,
        quotationBuyPrice: data.quotationBuyPrice,
        metalType: data.metalType,
        purity: data.purity,
      };

      if (data.paymentMethod === "FINANCIAL") {
        payload.contaCorrenteId = data.contaCorrenteId;
        payload.amountReceived = data.amountReceived;
      } else if (data.paymentMethod === "METAL_CREDIT") {
        payload.metalCreditId = data.metalCreditId;
        payload.amountInGrams = data.amountInGrams;
      } else if (data.paymentMethod === "METAL") {
        payload.amountInGrams = data.amountInGrams;
      }

      if (accountRec.saleId && data.selectedInstallmentId) {
        // If an installment is selected, pay the installment
        response = await api.patch(
          `/sales/${accountRec.saleId}/installments/${data.selectedInstallmentId}/receive`,
          payload
        );
      } else {
        // Otherwise, proceed with the existing AccountRec payment
        if (data.paymentMethod === "FINANCIAL") {
          response = await api.patch(`/accounts-rec/${accountRec.id}/receive`, {
            contaCorrenteId: data.contaCorrenteId,
            amountReceived: data.amountReceived,
            receivedAt: data.receivedAt,
          });
        } else if (data.paymentMethod === "METAL_CREDIT") {
          response = await api.patch(`/accounts-rec/${accountRec.id}/pay-with-metal-credit`, {
            metalCreditId: data.metalCreditId,
            amountInGrams: data.amountInGrams,
            customBuyPrice: data.quotationBuyPrice,
          });
        } else if (data.paymentMethod === "METAL") {
          response = await api.patch(`/accounts-rec/${accountRec.id}/pay-with-metal`, {
            metalType: data.metalType,
            amountInGrams: data.amountInGrams,
            quotation: data.quotationBuyPrice,
            purity: data.purity,
          });
        }
      }
      
      toast.success("Recebimento registrado com sucesso!");

      // Handle overpayment toast REMOVED for installment payments
      //   if (response?.data?.overpayment && response.data.overpayment > 0) {
      //     toast.info(`Crédito gerado: ${response.data.overpayment.toFixed(4)}g de ${data.metalType || 'metal'} foram creditados na conta do cliente.`);
      //   }

      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
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
            {isGoldBased ? (
              <>
                <span className="font-bold">Total:</span> <span>{accountRec.goldAmount?.toFixed(4)}g ({formatCurrency(accountRec.amount)})</span>
                <span className="font-bold">Pago:</span> <span>{accountRec.goldAmountPaid?.toFixed(4)}g ({formatCurrency(accountRec.amountPaid || 0)})</span>
                <span className="font-bold text-primary">Restante:</span> <span className="font-bold text-primary">{remainingGold.toFixed(4)}g ({formatCurrency(remainingBRL)})</span>
              </>
            ) : (
              <>
                <span className="font-bold">Total:</span> <span>{formatCurrency(accountRec.amount)}</span>
                <span className="font-bold">Pago:</span> <span>{formatCurrency(accountRec.amountPaid || 0)}</span>
                <span className="font-bold text-primary">Restante:</span> <span className="font-bold text-primary">{formatCurrency(remainingBRL)}</span>
              </>
            )}
          </div>
        </div>

        {accountRec.saleInstallments && accountRec.saleInstallments.length > 0 && (
          <FormField
            name="selectedInstallmentId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pagar Parcela Específica</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a parcela a pagar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accountRec.saleInstallments
                      .filter(inst => inst.status === 'PENDING') // Only show pending installments
                      .map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          Parcela #{inst.installmentNumber} - {formatCurrency(Number(inst.amount))} (Vencimento: {new Date(inst.dueDate).toLocaleDateString()})
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
          name="paymentMethod"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método de pagamento..." />
                  </SelectTrigger>
                </FormControl>
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
          <>
            <FormField
              name="amountReceived"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Recebido (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="receivedAt"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Recebimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Depositar na Conta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contasCorrentes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Cotação (R$/g)</FormLabel>
              <FormControl>
                <Input type="number" {...form.register("quotationBuyPrice")} />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Valor em Ouro (g)</FormLabel>
              <FormControl>
                <Input type="number" readOnly value={goldValue} />
              </FormControl>
            </FormItem>
          </>
        )}

        {selectedPaymentMethod === "METAL_CREDIT" && (
          <>
            <FormField
              name="metalCreditId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crédito de Metal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o crédito de metal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {metalCredits.map((mc) => (
                        <SelectItem key={mc.id} value={mc.id}>
                          {mc.metalType} - {mc.grams.toFixed(4)}g ({mc.date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedMetalCredit && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Disponível: {selectedMetalCredit.grams.toFixed(4)}g
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              name="amountInGrams"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade em Gramas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      {...field}
                      max={maxGramsToApply.toFixed(6)} // Set max attribute
                    />
                  </FormControl>
                  <FormMessage />
                  {selectedQuotationBuyPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Máximo aplicável: {maxGramsToApply.toFixed(4)}g (equivalente a {formatCurrency(remainingBRL)})
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              name="quotationBuyPrice"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cotação (R$/g)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {selectedPaymentMethod === "METAL" && (
          <>
            <FormField
              name="metalType"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Metal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de metal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AU">Ouro (AU)</SelectItem>
                      <SelectItem value="AG">Prata (AG)</SelectItem>
                      <SelectItem value="RH">Ródio (RH)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="amountInGrams"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade em Gramas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.000001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="quotationBuyPrice"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cotação (R$/g)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="purity"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pureza (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting
            ? "Salvando..."
            : "Confirmar Recebimento"}
        </Button>
      </form>
    </Form>
  );
}
