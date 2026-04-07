"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PureMetalLot } from "@/types/pure-metal-lot";
import { sellPureMetalLot } from "../pure-metal-lot.api";
import api from "@/lib/api";

const sellSchema = z.object({
  grams: z.coerce.number().min(0.01, "A quantidade deve ser maior que 0."),
  totalAmount: z.coerce.number().min(0, "O valor total deve ser maior ou igual a 0."),
  date: z.string().min(1, "A data da venda é obrigatória."),
  clientId: z.string().min(1, "Selecione um cliente."),
  notes: z.string().optional(),
});

type SellFormValues = z.infer<typeof sellSchema>;

interface SellPureMetalLotDialogProps {
  lot: PureMetalLot | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SellPureMetalLotDialog({
  lot,
  isOpen,
  onOpenChange,
  onSuccess,
}: SellPureMetalLotDialogProps) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellSchema) as any,
    defaultValues: {
      grams: lot?.remainingGrams || 0,
      totalAmount: 0,
      date: new Date().toISOString().split("T")[0],
      clientId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (lot && isOpen) {
      form.reset({
        grams: lot.remainingGrams,
        totalAmount: 0,
        date: new Date().toISOString().split("T")[0],
        clientId: "",
        notes: "",
      });
      fetchClients();
    }
  }, [lot, isOpen, form]);

  const fetchClients = async () => {
    try {
      const response = await api.get("/pessoas?role=CLIENT");
      setClients(response.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
      toast.error("Erro ao carregar lista de clientes.");
    }
  };

  const onSubmit = async (values: SellFormValues) => {
    if (!lot) return;

    try {
      setLoading(true);
      await sellPureMetalLot(lot.id, values);
      toast.success("Venda registrada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to sell metal", error);
      toast.error(error.response?.data?.message || "Erro ao registrar venda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vender Metal - Lote {lot?.lotNumber}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="grams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade para Vender (g)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      max={lot?.remainingGrams}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-[0.7rem] text-muted-foreground">
                    Saldo disponível: {lot?.remainingGrams.toFixed(2)}g
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Venda</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Opcional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Processando..." : "Confirmar Venda"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
