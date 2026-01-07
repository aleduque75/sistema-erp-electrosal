import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import api from "@/lib/api";
import { MetalCreditWithUsageDto } from "@/types/metal-credit-with-usage.dto";
import { ContaCorrente, Quotation } from "@prisma/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PayWithCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: MetalCreditWithUsageDto | null;
}

const formSchema = z.object({
  amountBRL: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  bankAccountId: z.string().min(1, "Selecione uma conta corrente."),
  paymentDate: z.date({ required_error: "A data é obrigatória." }),
  isFullPayment: z.boolean().optional(),
  quotation: z.coerce.number().optional(),
});

type PayWithCashFormValues = z.infer<typeof formSchema>;

export function PayWithCashModal({ isOpen, onClose, credit }: PayWithCashModalProps) {
  const queryClient = useQueryClient();
  const [gramsToSettle, setGramsToSettle] = useState<number>(0);

  const { data: bankAccounts, isLoading: isLoadingBankAccounts } = useQuery<ContaCorrente[]>({
    queryKey: ["contaCorrente"],
    queryFn: async () => {
      const response = await api.get("/contas-correntes");
      return response.data;
    },
  });

  const form = useForm<PayWithCashFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountBRL: 0,
      bankAccountId: "",
      paymentDate: new Date(),
      isFullPayment: false,
    },
  });

  const amountBRL = form.watch("amountBRL");
  const paymentDate = form.watch("paymentDate");
  const isFullPayment = form.watch("isFullPayment");
  const formQuotation = form.watch("quotation");

  useEffect(() => {
    if (credit && paymentDate) {
      api.get<Quotation>(`/quotations/latest?metal=${credit.metalType}&date=${paymentDate.toISOString()}`)
        .then(response => {
          form.setValue("quotation", response.data.buyPrice);
        })
        .catch(() => {
          toast.error("Cotação não encontrada para a data selecionada.");
          form.setValue("quotation", 0);
        });
    }
  }, [credit, paymentDate, form]);

  useEffect(() => {
    if (credit) {
      if (isFullPayment) {
        setGramsToSettle(Number(credit.grams));
        if (amountBRL > 0) {
          const newQuotation = amountBRL / Number(credit.grams);
          form.setValue("quotation", newQuotation);
        }
      } else {
        if (amountBRL > 0 && formQuotation) {
          const calculatedGrams = amountBRL / formQuotation;
          setGramsToSettle(calculatedGrams);
        } else {
          setGramsToSettle(0);
        }
      }
    } else {
      setGramsToSettle(0);
    }
  }, [amountBRL, formQuotation, isFullPayment, credit, form]);

  const mutation = useMutation({
    mutationFn: (data: PayWithCashFormValues) => {
      return api.post("/metal-credits/pay-with-cash", {
        ...data,
        metalCreditId: credit?.id,
      });
    },
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["metal-credits"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Falha ao registrar pagamento.");
    },
  });

  const onSubmit = (data: PayWithCashFormValues) => {
    const tolerance = 0.0001;
    if (gramsToSettle > Number(credit?.grams) + tolerance) {
      form.setError("amountBRL", { message: "O valor a pagar excede o saldo do crédito de metal." });
      return;
    }
    mutation.mutate(data);
  };

  const bankAccountOptions: ComboboxOption[] =
    bankAccounts?.map((account) => ({
      value: account.id,
      label: account.nome,
    })) || [];

  if (!credit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar Crédito de Metal com Dinheiro</DialogTitle>
          <DialogDescription>
            Registre o pagamento de um crédito de metal para o cliente. Saldo: {Number(credit.grams).toFixed(4)}g
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quotation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cotação de Compra ({credit.metalType})</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFullPayment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Quitar Saldo Total
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountBRL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor a Pagar (BRL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} disabled={isFullPayment} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {gramsToSettle > 0 && (
                <div className="text-sm">
                  Gramas a serem liquidadas:{" "}
                  <span className="font-semibold">
                    {new Intl.NumberFormat("pt-BR", {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    }).format(gramsToSettle)} g
                  </span>
                </div>
              )}

              <Controller
                name="bankAccountId"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Conta Corrente</FormLabel>
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      options={bankAccountOptions}
                      placeholder="Selecione a conta..."
                      loading={isLoadingBankAccounts}
                    />
                    <FormMessage>{form.formState.errors.bankAccountId?.message}</FormMessage>
                  </div>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending || !formQuotation}>
                {mutation.isPending ? "Salvando..." : "Salvar Pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
