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
import { ContaCorrenteType } from "@sistema-erp-electrosal/core";

const formSchema = z.object({
  supplierMetalAccountId: z.string().min(1, "Selecione a conta do fornecedor."),
  grams: z.coerce.number().min(0.001, "A quantidade de ouro deve ser maior que zero."),
  notes: z.string().optional(),
});

type TransferFormValues = z.infer<typeof formSchema>;

interface ContaCorrente {
  id: string;
  nome: string;
  type: typeof ContaCorrenteType;
  initialBalanceGold: number;
}

export default function TransferFromSupplierAccountPage() {
  const router = useRouter();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierMetalAccountId: "",
      grams: 0,
      notes: "",
    },
  });

  const { data: supplierAccounts, isLoading: isLoadingSupplierAccounts } = useQuery<ContaCorrente[]>({
    queryKey: ["supplierAccounts"],
    queryFn: async () => {
      const response = await api.get("/contas-correntes?type=FORNECEDOR_METAL");
      return response.data;
    },
  });

  const onSubmit = async (values: TransferFormValues) => {
    try {
      await api.post("/metal-accounts/transfer-from-supplier-account-to-pure-metal-lots", values);
      toast.success("Transferência realizada com sucesso!");
      form.reset();
      router.push("/contas-correntes"); // Redirecionar para a listagem de contas
    } catch (error: any) {
      toast.error("Erro ao realizar transferência", {
        description: error.response?.data?.message || "Ocorreu um erro desconhecido",
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Transferir de Conta Fornecedor para Lotes de Metal Puro</CardTitle>
          <CardDescription>Transfira ouro de uma conta corrente de fornecedor para o estoque de lotes de metal puro da empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="supplierMetalAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta Corrente do Fornecedor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingSupplierAccounts}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingSupplierAccounts ? (
                          <SelectItem value="loading" disabled>
                            Carregando contas...
                          </SelectItem>
                        ) : (
                          supplierAccounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.nome} (Saldo Ouro: {account.initialBalanceGold.toFixed(3)}g)
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
                name="grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Ouro (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="0.000" {...field} />
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
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione observações sobre a transferência..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Transferindo..." : "Realizar Transferência"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
