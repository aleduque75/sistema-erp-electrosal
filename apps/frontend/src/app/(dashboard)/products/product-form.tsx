// apps/frontend/src/app/(dashboard)/products/product-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useState, useEffect } from "react";

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

// Define a interface do Produto
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number;
  stock: number;
  productGroupId?: string;
  goldValue?: number;
}

// Define o schema de validação com Zod
const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  price: z.coerce.number().positive("O preço deve ser um número positivo."),
  costPrice: z.coerce
    .number()
    .positive("O preço de custo deve ser um número positivo.")
    .optional(),
  stock: z.coerce
    .number()
    .int()
    .nonnegative("O estoque não pode ser negativo."),
  description: z.string().optional(),
  productGroupId: z.string().optional(),
  goldValue: z.coerce.number().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSave: () => void;
}

interface ProductGroup {
  id: string;
  name: string;
}

export function ProductForm({ product, onSave }: ProductFormProps) {
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);

  useEffect(() => {
    const fetchProductGroups = async () => {
      try {
        const response = await api.get("/product-groups");
        setProductGroups(response.data);
      } catch (error) {
        toast.error("Falha ao buscar grupos de produtos.");
      }
    };
    fetchProductGroups();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      price: product?.price || 0,
      costPrice: product?.costPrice || 0,
      stock: product?.stock || 0,
      description: product?.description || "",
      productGroupId: product?.productGroupId || "",
      goldValue: product?.goldValue || 0,
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (product) {
        await api.patch(`/products/${product.id}`, data);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await api.post("/products", data);
        toast.success("Produto criado com sucesso!");
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
                <Input placeholder="Shampoo Revitalizante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo do Produto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Venda (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Custo (R$)</FormLabel>
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
            name="goldValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor em Ouro (g)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.001" {...field} />
                </FormControl>
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
                <Textarea placeholder="Descrição do produto..." {...field} />
              </FormControl>
              <FormMessage />
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