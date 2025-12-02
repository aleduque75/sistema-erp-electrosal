// src/components/recovery-orders/ProcessRecoveryFinalizationModal.tsx

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RecoveryOrder } from "@/types/recovery-order";
import { finalizeRecoveryOrder } from "@/services/recoveryOrdersApi";

const finalizeSchema = z.object({
  teorFinal: z.coerce
    .number()
    .min(0, "O teor não pode ser negativo.")
    .max(1, "O teor não pode ser maior que 1 (100%)."),
});

type FinalizeFormData = z.infer<typeof finalizeSchema>;

interface LaunchPurityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onSuccess: () => void;
}

export function LaunchPurityModal({
  isOpen,
  onOpenChange,
  recoveryOrder,
  onSuccess,
}: LaunchPurityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FinalizeFormData>({
    resolver: zodResolver(finalizeSchema),
    defaultValues: {
      teorFinal: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ teorFinal: undefined });
    }
  }, [isOpen, form]);

  if (!recoveryOrder) return null;

  const onSubmit = async (data: FinalizeFormData) => {
    setIsSubmitting(true);
    try {
      await finalizeRecoveryOrder(recoveryOrder.id, data);
      toast.success("Ordem de recuperação finalizada com sucesso!");
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      toast.error("Erro ao finalizar ordem de recuperação", {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Teor Final e Finalizar Ordem</DialogTitle>
          <DialogDescription>
            Informe o teor de pureza final para a ordem ID:{" "}
            <strong>{recoveryOrder.id}</strong>. Esta ação é irreversível.
            <br />
            <span className="text-sm text-muted-foreground">
              Resultado do Processamento:{" "}
              {/* CORRIGIDO: Usa coalescência nula e confia que a interface RecoveryOrder foi atualizada */}
              {recoveryOrder.resultadoProcessamentoGramas ?? "N/A"}g
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="teorFinal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teor Final (Ex: 0.995 para 99.5%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.995"
                      {...field}
                      // Adiciona um onChange para garantir que o valor seja numérico ou undefined (Zod)
                      onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Finalizar Ordem
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}