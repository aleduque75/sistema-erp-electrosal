"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

const formSchema = z.object({
  grams: z.coerce.number().min(0.001, "A quantidade de ouro deve ser maior que zero."),
  notes: z.string().optional(),
  transferDate: z.string().optional(), // Data da transferência
  goldQuoteValue: z.coerce.number().optional(), // Cotação do ouro manual
});

type TransferFormValues = z.infer<typeof formSchema>;

interface TransferFromSupplierAccountFormProps {
  supplierMetalAccountId: string;
  onSave: () => void;
  onClose: () => void;
}

export function TransferFromSupplierAccountForm({
  supplierMetalAccountId,
  onSave,
  onClose,
}: TransferFromSupplierAccountFormProps) {
  const router = useRouter();
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grams: 0,
      notes: "",
      transferDate: format(new Date(), "yyyy-MM-dd"), // Default para hoje
      goldQuoteValue: undefined,
    },
  });

  const transferDateWatch = form.watch("transferDate");

  useEffect(() => {
    const fetchQuote = async () => {
      if (!transferDateWatch) return;
      setIsLoadingQuote(true);
      try {
        const response = await api.get(
          `/quotations/latest?metal=AU&date=${transferDateWatch}`
        );
        if (response.data?.sellPrice) {
          form.setValue("goldQuoteValue", response.data.sellPrice);
        } else {
          form.setValue("goldQuoteValue", undefined);
          toast.info("Nenhuma cotação de ouro encontrada para a data selecionada.");
        }
      } catch (error) {
        form.setValue("goldQuoteValue", undefined);
        toast.error("Falha ao buscar cotação do ouro.");
      } finally {
        setIsLoadingQuote(false);
      }
    };
    fetchQuote();
  }, [transferDateWatch, form]);

  const onSubmit = async (values: TransferFormValues) => {
    try {
      await api.post(
        "/metal-accounts/transfer-from-supplier-account-to-pure-metal-lots",
        {
          supplierMetalAccountId,
          grams: values.grams,
          notes: values.notes,
          transferDate: values.transferDate ? new Date(values.transferDate) : undefined,
          goldQuoteValue: values.goldQuoteValue,
        }
      );
      toast.success("Transferência realizada com sucesso!");
      form.reset();
      onSave();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao realizar transferência", {
        description: error.response?.data?.message || "Ocorreu um erro desconhecido",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="transferDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Transferência</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goldQuoteValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cotação do Ouro (R$/g)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isLoadingQuote}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grams"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade de Ouro (g)</FormLabel>
              <FormControl>
                <Input type="number" step="0.001" placeholder="0.000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione observações sobre a transferência..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting || isLoadingQuote}>
            {form.formState.isSubmitting ? "Transferindo..." : "Realizar Transferência"}
          </Button>
        </div>
      </form>
    </Form>
  );
}