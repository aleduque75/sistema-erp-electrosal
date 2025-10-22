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
interface ContaCorrente {
  id: string;
  nome: string;
}
interface AccountRec {
  id: string;
  amount: number;
  description: string;
  clientId?: string; // Adicionado
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
  paymentMethod: z.enum(["financial", "metalCredit", "metal"], { required_error: "Selecione um método de pagamento." }),
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
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "financial") {
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
  } else if (data.paymentMethod === "metalCredit") {
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
  } else if (data.paymentMethod === "metal") {
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
  accountRec,
  onSave,
}: ReceivePaymentFormProps) {
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [metalCredits, setMetalCredits] = useState<MetalCredit[]>([]); // Adicionado
  const [quotations, setQuotations] = useState<Quotation[]>([]); // Adicionado
  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "financial", // Default para pagamento financeiro
      amountReceived: accountRec.amount,
      receivedAt: accountRec.sale?.createdAt ? new Date(accountRec.sale.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      contaCorrenteId: "",
      amountInGrams: 0,
      metalCreditId: "",
      quotationId: "",
    },
  });

  const selectedPaymentMethod = form.watch("paymentMethod"); // Observar o método de pagamento
  const selectedMetalCreditId = form.watch("metalCreditId");
  const selectedQuotationId = form.watch("quotationId");

  const selectedMetalCredit = metalCredits.find(mc => mc.id === selectedMetalCreditId);
  const selectedQuotation = quotations.find(q => q.id === selectedQuotationId);

  const selectedQuotationBuyPrice = form.watch("quotationBuyPrice");

  const maxGramsToApply = useMemo(() => {
    if (!selectedQuotationBuyPrice || selectedQuotationBuyPrice <= 0) return 0;
    return accountRec.amount / selectedQuotationBuyPrice;
  }, [accountRec.amount, selectedQuotationBuyPrice]);

  useEffect(() => {
    if (selectedPaymentMethod === "financial") {
      api.get("/contas-correntes").then((res) => setContasCorrentes(res.data));
    } else if (selectedPaymentMethod === "metalCredit" && accountRec.clientId) {
      api.get(`/metal-credits/client/${accountRec.clientId}`).then((res) => {
        console.log('[DEBUG] Frontend - Metal Credits API Response:', res.data);
        setMetalCredits(res.data.map((mc: any) => ({
          id: mc._id.value,
          metalType: mc.props.metalType,
          grams: Number(mc.props.grams),
          date: mc.props.date,
        })));
      });
      api.get("/quotations?metalType=AU,AG").then((res) => {
        const fetchedQuotations = res.data.map(q => ({ ...q, buyPrice: Number(q.buyPrice) }));
        console.log('[DEBUG] Frontend - Fetched Quotations (raw):', fetchedQuotations);
        setQuotations(fetchedQuotations);

        // Pre-fill with the most recent quotation for AU (or any default metal type)
        if (fetchedQuotations.length > 0) {
          const sortedQuotations = fetchedQuotations
            .filter(q => q.metal === "AU" && new Date(q.date) <= new Date()) // Filter for Gold quotations and past/present dates
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          console.log('[DEBUG] Frontend - Sorted AU Quotations:', sortedQuotations);

          const mostRecentAuQuotation = sortedQuotations[0];
          
          if (mostRecentAuQuotation) {
            form.setValue("quotationBuyPrice", mostRecentAuQuotation.buyPrice);
            console.log('[DEBUG] Frontend - Pre-filling quotationBuyPrice with:', mostRecentAuQuotation.buyPrice);
            console.log('[DEBUG] Frontend - Most Recent AU Quotation:', mostRecentAuQuotation);
          }
        }
      });
    }
  }, [selectedPaymentMethod, accountRec.clientId]);

  useEffect(() => {
    if (selectedPaymentMethod === "metalCredit" && maxGramsToApply > 0) {
      form.setValue("amountInGrams", maxGramsToApply);
    }
  }, [maxGramsToApply, selectedPaymentMethod]);

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
      if (data.paymentMethod === "financial") {
        await api.patch(`/accounts-rec/${accountRec.id}/receive`, {
          contaCorrenteId: data.contaCorrenteId,
          amountReceived: data.amountReceived,
          receivedAt: data.receivedAt,
        });
      } else if (data.paymentMethod === "metalCredit") {
        await api.patch(`/accounts-rec/${accountRec.id}/pay-with-metal-credit`, {
          metalCreditId: data.metalCreditId,
          amountInGrams: data.amountInGrams,
          customBuyPrice: data.quotationBuyPrice,
        });
      } else if (data.paymentMethod === "metal") {
        await api.patch(`/accounts-rec/${accountRec.id}/pay-with-metal`, {
          metalType: data.metalType,
          amountInGrams: data.amountInGrams,
          quotation: data.quotationBuyPrice,
          purity: data.purity,
        });
      }
      toast.success("Recebimento registrado com sucesso!");
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
                  <SelectItem value="financial">Dinheiro / Transferência</SelectItem>
                  <SelectItem value="metalCredit">Crédito de Metal</SelectItem>
                  <SelectItem value="metal">Receber em Metal</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedPaymentMethod === "financial" && (
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

        {selectedPaymentMethod === "metalCredit" && (
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
                      Máximo aplicável: {maxGramsToApply.toFixed(4)}g (equivalente a {formatCurrency(accountRec.amount)})
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

        {selectedPaymentMethod === "metal" && (
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