"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

// Ajuste o caminho do serviço conforme sua estrutura
import { lancarResultadoAnaliseApi } from "@/services/analisesApi";

const lancarResultadoSchema = z.object({
  resultadoAnaliseValor: z.coerce
    .number()
    .positive("O resultado deve ser um número positivo."),
  unidadeResultado: z.string().min(1, "Unidade é obrigatória.").max(20),
  percentualQuebra: z.coerce
    .number()
    .min(0, "Deve ser no mínimo 0")
    .max(1, "Deve ser um decimal até 1 (ex: 0.05 para 5%)."),
  taxaServicoPercentual: z.coerce
    .number()
    .min(0, "Deve ser no mínimo 0")
    .max(1, "Deve ser um decimal até 1 (ex: 0.20 para 20%)."),
  observacoes: z.string().max(1000).optional(),
});
type LancarResultadoFormData = z.infer<typeof lancarResultadoSchema>;

interface LancarResultadoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  analise: any | null; // Ajuste o tipo conforme sua interface
  onSuccess: () => void;
}

export function LancarResultadoModal({
  isOpen,
  onOpenChange,
  analise,
  onSuccess,
}: LancarResultadoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LancarResultadoFormData>({
    resolver: zodResolver(lancarResultadoSchema),
    defaultValues: {
      resultadoAnaliseValor: undefined,
      unidadeResultado: "g/L Au",
      percentualQuebra: 0.05,
      taxaServicoPercentual: 0.2,
      observacoes: "",
    },
  });

  if (!analise) return null;

  const onSubmit = async (data: LancarResultadoFormData) => {
    setIsSubmitting(true);
    try {
      await lancarResultadoAnaliseApi(analise.id, data);
      toast.success("Resultado lançado com sucesso!");
      onSuccess();
      onOpenChange(false);
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
          <DialogTitle>Lançar Resultado da Análise</DialogTitle>
          <DialogDescription>
            Para a Análise Nº: <strong>{analise.numeroAnalise}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="resultadoAnaliseValor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado (valor)</FormLabel>
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
              name="percentualQuebra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual de Quebra</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormDescription>Ex: 0.05 para 5%</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxaServicoPercentual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Serviço (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormDescription>Ex: 0.20 para 20%</FormDescription>
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
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lançar Resultado
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
