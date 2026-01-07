import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import api from "@/lib/api";
import { MetalCreditWithUsageDto } from "@/types/metal-credit-with-usage.dto";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface EditMetalCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: MetalCreditWithUsageDto | null;
}

const formSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
});

type EditMetalCreditFormValues = z.infer<typeof formSchema>;

export function EditMetalCreditModal({ isOpen, onClose, credit }: EditMetalCreditModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditMetalCreditFormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (credit) {
      form.reset({
        date: new Date(credit.date),
      });
    }
  }, [credit, form]);

  const mutation = useMutation({
    mutationFn: (data: EditMetalCreditFormValues) => {
      return api.patch(`/metal-credits/${credit?.id}`, data);
    },
    onSuccess: () => {
      toast.success("Crédito de metal atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["metal-credits"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Falha ao atualizar o crédito de metal.");
    },
  });

  const onSubmit = (data: EditMetalCreditFormValues) => {
    mutation.mutate(data);
  };

  if (!credit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Crédito de Metal</DialogTitle>
          <DialogDescription>
            Atualize a data do crédito de metal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Crédito</FormLabel>
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
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
