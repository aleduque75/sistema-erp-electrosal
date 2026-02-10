import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, FlaskConical } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RecoveryOrder } from "@/types/recovery-order";
import { updateRecoveryOrderPurity } from "@/services/recoveryOrdersApi";

const enterResultSchema = z.object({
  resultadoProcessamentoGramas: z.coerce.number().positive("O resultado deve ser um número positivo."),
  observacoes: z.string().max(1000).optional(),
});

type EnterResultFormData = z.infer<typeof enterResultSchema>;

interface LaunchResultModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onSuccess: () => void;
}

export function LaunchResultModal({ // Filename is kept, but this is now the "Enter Result" modal
  isOpen,
  onOpenChange,
  recoveryOrder,
  onSuccess,
}: LaunchResultModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EnterResultFormData>({
    resolver: zodResolver(enterResultSchema),
    defaultValues: {
      resultadoProcessamentoGramas: undefined,
      observacoes: "",
    },
  });

  useEffect(() => {
    if (recoveryOrder) {
      form.reset({
        resultadoProcessamentoGramas: recoveryOrder.resultadoProcessamentoGramas || undefined,
        observacoes: recoveryOrder.observacoes || "",
      });
    }
  }, [recoveryOrder, form]);


  if (!recoveryOrder) return null;

  const onSubmit = async (data: EnterResultFormData) => {
    setIsSubmitting(true);
    try {
      await updateRecoveryOrderPurity(recoveryOrder.id, data);
      toast.success("Resultado do processamento lançado com sucesso!");
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      toast.error("Erro ao lançar resultado", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Resultado do Processamento</DialogTitle>
          <DialogDescription>
            Informe o peso bruto recuperado (antes de aplicar o teor) para a ordem ID:{" "}
            <strong>{recoveryOrder.id}</strong>.
            <br />
            <span className="text-sm text-muted-foreground">
              Total Bruto Estimado que entrou na ordem: {recoveryOrder.totalBrutoEstimadoGramas}g
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="resultadoProcessamentoGramas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado do Processamento (g)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="Ex: 56.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                  <FlaskConical className="mr-2 h-4 w-4" />
                )}
                Lançar Resultado
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
