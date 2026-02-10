"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  productId: z.string().min(1, "Selecione um produto."),
  quantity: z.coerce.number().min(0.001, "A quantidade deve ser maior que zero."),
  costPrice: z.coerce.number().min(0, "O custo não pode ser negativo."),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
});

type AdjustStockFormValues = z.infer<typeof formSchema>;

export default function AdjustStockPage() {
  const router = useRouter();

  const form = useForm<AdjustStockFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: 0,
      costPrice: 0,
      batchNumber: "",
      notes: "",
    },
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get("/products");
      return response.data;
    },
  });

  const onSubmit = async (values: AdjustStockFormValues) => {
    try {
      await api.post("/stock/adjust", values);
      toast.success("Estoque ajustado com sucesso!");
      form.reset();
      router.push("/estoque"); // Redirecionar para a página de estoque (a ser criada)
    } catch (error: any) {
      toast.error("Erro ao ajustar estoque", {
        description: error.response?.data?.message || "Ocorreu um erro desconhecido",
      });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Ajuste de Estoque</CardTitle>
          <CardDescription>Use esta página para fazer uma entrada manual no estoque, criando um novo lote.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingProducts}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={isLoadingProducts ? "Carregando produtos..." : "Selecione um produto..."}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingProducts ? (
                          <SelectItem value="loading" disabled>
                            Carregando produtos...
                          </SelectItem>
                        ) : (
                          products?.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))
                        )}
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
                    <FormLabel>Quantidade de Entrada</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="1000.00" {...field} />
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
                    <FormLabel>Custo do Lote (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Lote (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="LOTE-INICIAL-001" {...field} />
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
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Estoque inicial do Sal 68%..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingProducts}>
                {form.formState.isSubmitting ? "Salvando..." : "Ajustar Estoque"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}