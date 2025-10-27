"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface RawMaterial {
  id: string;
  name: string;
  description?: string | null;
  cost: number;
  stock: number;
  unit: "GRAMS" | "KILOGRAMS";
  isForResale: boolean;
}

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  cost: z.coerce.number().positive("O custo deve ser um número positivo."),
  stock: z.coerce.number().nonnegative("O estoque não pode ser negativo."),
  unit: z.enum(["GRAMS", "KILOGRAMS", "LITERS", "UNITS"]),
  description: z.string().optional(),
  isForResale: z.boolean().default(false),
});

type RawMaterialFormValues = z.infer<typeof formSchema>;

interface RawMaterialFormProps {
  rawMaterial?: RawMaterial | null;
  onSave: () => void;
}

export function RawMaterialForm({ rawMaterial, onSave }: RawMaterialFormProps) {
  const form = useForm<RawMaterialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rawMaterial?.name || "",
      cost: rawMaterial?.cost || 0,
      stock: rawMaterial?.stock || 0,
      unit: rawMaterial?.unit || "GRAMS",
      description: rawMaterial?.description || "",
      isForResale: rawMaterial?.isForResale || false,
    },
  });

  const onSubmit = async (data: RawMaterialFormValues) => {
    try {
      if (rawMaterial) {
        await api.patch(`/raw-materials/${rawMaterial.id}`, data);
        toast.success("Matéria-prima atualizada com sucesso!");
      } else {
        await api.post("/raw-materials", data);
        toast.success("Matéria-prima criada com sucesso!");
      }
      onSave();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Ocorreu um erro.";
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Pó de Zinco" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de Estoque</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="GRAMS">Gramas (g)</SelectItem>
                    <SelectItem value="KILOGRAMS">Quilogramas (kg)</SelectItem>
                    <SelectItem value="LITERS">Litros (L)</SelectItem>
                    <SelectItem value="UNITS">Unidades (un)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição da matéria-prima..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isForResale"
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
                  Para revenda
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
