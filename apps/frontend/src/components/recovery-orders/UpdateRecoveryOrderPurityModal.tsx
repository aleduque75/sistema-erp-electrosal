import { useState } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RecoveryOrder } from "@/types/recovery-order";
import { updateRecoveryOrderPurity } from "@/services/recoveryOrdersApi";

const updatePuritySchema = z.object({
  resultadoFinal: z.coerce.number().positive("O resultado final deve ser um número positivo."),
  unidadeResultado: z.string().min(1, "Unidade é obrigatória.").max(20),
  volumeProcessado: z.coerce.number().positive("O volume processado deve ser um número positivo."),
  unidadeProcessada: z.string().min(1, "Unidade é obrigatória.").max(20),
  observacoes: z.string().max(1000).optional(),
});

type UpdatePurityFormData = z.infer<typeof updatePuritySchema>;

interface UpdateRecoveryOrderPurityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onSuccess: () => void;
}

export function UpdateRecoveryOrderPurityModal({
  isOpen,
  onOpenChange,
  recoveryOrder,
  onSuccess,
}: UpdateRecoveryOrderPurityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdatePurityFormData>({
    resolver: zodResolver(updatePuritySchema),
    defaultValues: {
      resultadoFinal: recoveryOrder?.resultadoFinal || undefined,
      unidadeResultado: recoveryOrder?.unidadeResultado || "g",
      volumeProcessado: recoveryOrder?.volumeProcessado || undefined,
      unidadeProcessada: recoveryOrder?.unidadeProcessada || "g",
      observacoes: recoveryOrder?.observacoes || "",
    },
  });

  if (!recoveryOrder) return null;

  const onSubmit = async (data: UpdatePurityFormData) => {
    setIsSubmitting(true);
    try {
      await updateRecoveryOrderPurity(recoveryOrder.id, data);
      toast.success("Resultado final da recuperação lançado com sucesso!");
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      toast.error("Erro ao lançar resultado final da recuperação", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Resultado Final da Recuperação</DialogTitle>
          <DialogDescription>
            Informe o resultado final do processo de recuperação para a ordem ID:{" "}
            <strong>{recoveryOrder.id}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="resultadoFinal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado Final (g)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unidadeResultado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="volumeProcessado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume Processado</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unidadeProcessada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade Processada</FormLabel>
                  <FormControl>
                    <Input {...field} />
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