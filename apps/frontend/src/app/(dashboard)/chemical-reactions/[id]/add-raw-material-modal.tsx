"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface AddRawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  chemicalReactionId: string;
  onRawMaterialAdded: () => void;
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
}

const formSchema = z.object({
  rawMaterialId: z.string().min(1, "Selecione uma matéria-prima."),
  quantity: z.coerce.number().positive("A quantidade deve ser um número positivo."),
});

type AddRawMaterialFormValues = z.infer<typeof formSchema>;

export function AddRawMaterialModal({ isOpen, onClose, chemicalReactionId, onRawMaterialAdded }: AddRawMaterialModalProps) {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const form = useForm<AddRawMaterialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rawMaterialId: "",
      quantity: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchRawMaterials = async () => {
        try {
          const response = await api.get("/raw-materials");
          setRawMaterials(response.data);
        } catch (error) {
          toast.error("Falha ao buscar matérias-primas.");
        }
      };
      fetchRawMaterials();
    }
  }, [isOpen]);

  const onSubmit = async (data: AddRawMaterialFormValues) => {
    try {
      await api.post(`/chemical-reactions/${chemicalReactionId}/raw-materials`, data);
      toast.success("Matéria-prima adicionada com sucesso!");
      onRawMaterialAdded();
      onClose();
    } catch (error) {
      toast.error("Falha ao adicionar matéria-prima.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Matéria-Prima</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rawMaterialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matéria-Prima</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a matéria-prima" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rawMaterials.map((rm) => (
                        <SelectItem key={rm.id} value={rm.id}>
                          {rm.name} ({rm.unit})
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}