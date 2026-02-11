import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";

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
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { RecoveryOrder } from "@/types/recovery-order";

const editRecoveryOrderSchema = z.object({
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
});

type EditRecoveryOrderFormData = z.infer<typeof editRecoveryOrderSchema>;

interface EditRecoveryOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onSuccess: () => void;
}

export function EditRecoveryOrderModal({
  isOpen,
  onOpenChange,
  recoveryOrder,
  onSuccess,
}: EditRecoveryOrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditRecoveryOrderFormData>({
    resolver: zodResolver(editRecoveryOrderSchema),
    defaultValues: {
      descricao: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (recoveryOrder) {
      form.reset({
        descricao: recoveryOrder.descricao || "",
        observacoes: recoveryOrder.observacoes || "",
      });
    }
  }, [recoveryOrder, form]);

  const onSubmit = async (data: EditRecoveryOrderFormData) => {
    if (!recoveryOrder) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/recovery-orders/${recoveryOrder.id}`, data);
      toast.success("Ordem de recuperação atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao atualizar ordem de recuperação", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Ordem de Recuperação</DialogTitle>
          <DialogDescription>
            Atualize as informações básicas da ordem Nº {recoveryOrder?.orderNumber}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Processo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Recuperação de Ouro 18k..." />
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
                    <Textarea 
                      {...field} 
                      placeholder="Informações adicionais importantes..." 
                      className="resize-none"
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
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
