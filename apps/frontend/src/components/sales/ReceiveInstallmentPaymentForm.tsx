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
import { SaleInstallment } from "@/types/sale";
import { TipoMetal } from "@prisma/client";

interface ReceiveInstallmentPaymentFormProps {
  installment: SaleInstallment;
  saleId: string;
  onSave: () => void;
}

interface ContaCorrente {
  id: string;
  nome: string;
}

interface MetalCredit {
  id: string;
  metalType: string;
  grams: number;
  date: string;
}

const formSchema = z.object({
  paymentMethod: z.enum(["FINANCIAL", "METAL_CREDIT", "METAL"], { required_error: "Selecione um método de pagamento." }),
  contaCorrenteId: z.string().optional(),
  metalCreditId: z.string().optional(),
  amountReceived: z.coerce
    .number()
    .positive("O valor recebido deve ser maior que zero.")
    .optional(),
  amountInGrams: z.coerce.number().optional(),
  receivedAt: z.string().min(1, "A data é obrigatória.").optional(),
  quotationBuyPrice: z.coerce
    .number()
    .min(0.01, "O preço da cotação deve ser maior que zero.").optional(),
  metalType: z.nativeEnum(TipoMetal).optional(),
  purity: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
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

export function ReceiveInstallmentPaymentForm({
  installment,
  saleId,
  onSave,
}: ReceiveInstallmentPaymentFormProps) {
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [metalCredits, setMetalCredits] = useState<MetalCredit[]>([]);
  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "FINANCIAL",
      amountReceived: parseFloat(Number(installment.amount).toFixed(2)), // Default to installment amount
      receivedAt: new Date().toISOString().split("T")[0],
      contaCorrenteId: "",
      amountInGrams: 0,
      metalCreditId: "",
    },
  });

  const selectedPaymentMethod = form.watch("paymentMethod");
  const selectedMetalCreditId = form.watch("metalCreditId");
  const selectedMetalCredit = metalCredits.find(mc => mc.id === selectedMetalCreditId);
  const quotationBuyPrice = form.watch("quotationBuyPrice");
  const amountReceived = form.watch("amountReceived");
  const receivedAt = form.watch("receivedAt");

  const [goldValue, setGoldValue] = useState<number>(0);

  useEffect(() => {
    if (amountReceived && quotationBuyPrice) {
      setGoldValue(amountReceived / quotationBuyPrice);
    }
  }, [amountReceived, quotationBuyPrice]);

  useEffect(() => {
    if (selectedPaymentMethod === "FINANCIAL") {
      api.get("/contas-correntes").then((res) => setContasCorrentes(res.data));
    } else if (selectedPaymentMethod === "METAL_CREDIT") {
      // Assuming client ID can be derived from saleId or passed as prop
      // For now, we'll fetch all metal credits and filter by client later if needed
      api.get("/metal-credits").then((res) => {
        setMetalCredits(res.data.map((mc: any) => ({
          id: mc.id,
          metalType: mc.metalType,
          grams: Number(mc.grams),
          date: mc.date,
        })));
      });
    }
  }, [selectedPaymentMethod]);

  useEffect(() => {
    if (receivedAt) {
      api.get(`/quotations/by-date?date=${receivedAt}&metal=AU`).then((res) => {
        if (res.data) {
          form.setValue("quotationBuyPrice", res.data.buyPrice);
        }
      });
    }
  }, [receivedAt, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
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

      await api.patch(`/sales/${saleId}/installments/${installment.id}/receive`, payload);
      toast.success("Recebimento de parcela registrado com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Registrar recebimento para a parcela #<span className="font-medium">{installment.installmentNumber}</span> da venda #<span className="font-medium">{saleId}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Valor da Parcela: <span className="font-medium">{formatCurrency(installment.amount)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Vencimento: <span className="font-medium">{new Date(installment.dueDate).toLocaleDateString()}</span>
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
                    />
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
            : "Confirmar Recebimento da Parcela"}
        </Button>
      </form>
    </Form>
  );
}
