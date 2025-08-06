"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Fee {
  id: string;
  installments: number;
  feePercentage: number;
}

const formSchema = z.object({
  installments: z.coerce.number().int().min(1, "Mínimo 1 parcela."),
  feePercentage: z.coerce.number().min(0, "A taxa não pode ser negativa."),
});

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [absorbFee, setAbsorbFee] = useState(false);
  const [creditCardReceiveDays, setCreditCardReceiveDays] = useState(30);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { installments: 1, feePercentage: 0 },
  });

  const fetchOrgSettings = async () => {
    try {
      const response = await api.get('/settings/organization');
      setAbsorbFee(response.data.absorbCreditCardFee);
      setCreditCardReceiveDays(response.data.creditCardReceiveDays || 30);
    } catch (error) {
      toast.error("Erro ao carregar configurações da organização.");
    }
  };

  useEffect(() => {
    fetchFees();
    fetchOrgSettings();
  }, []);

  const handleSettingChange = async (data: { [key: string]: any }) => {
    try {
      await api.patch('/settings/organization', data);
      toast.success("Configuração atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar a configuração.");
    }
  };

  const handleAbsorbFeeChange = (checked: boolean) => {
    setAbsorbFee(checked);
    handleSettingChange({ absorbCreditCardFee: checked });
  };

  const handleReceiveDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value, 10);
    setCreditCardReceiveDays(days);
    handleSettingChange({ creditCardReceiveDays: days });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await api.post('/credit-card-fees', values);
      toast.success(`Taxa para ${values.installments}x salva com sucesso!`);
      form.reset();
      fetchFees(); // Atualiza a lista
    } catch (error) {
      toast.error("Erro ao salvar a taxa. Verifique se já existe uma regra para este número de parcelas.");
    }
  };

  const handleDelete = async (feeId: string) => {
    if (!confirm("Tem certeza que deseja remover esta regra de taxa?")) return;
    try {
      await api.delete(`/credit-card-fees/${feeId}`);
      toast.success("Taxa removida com sucesso!");
      fetchFees(); // Atualiza a lista
    } catch (error) {
      toast.error("Erro ao remover a taxa.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais de Taxas</CardTitle>
          <CardDescription>Gerencie como as taxas de cartão de crédito são aplicadas nas vendas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="absorb-fee">Absorver taxa de cartão de crédito (não repassar ao cliente)</Label>
            <Switch
              id="absorb-fee"
              checked={absorbFee}
              onCheckedChange={handleAbsorbFeeChange}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="receive-days">Prazo para recebimento (dias)</Label>
            <Input
              id="receive-days"
              type="number"
              value={creditCardReceiveDays}
              onChange={handleReceiveDaysChange}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Regra de Taxa</CardTitle>
          <CardDescription>Defina a porcentagem da taxa para um número específico de parcelas no cartão de crédito.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
              <FormField control={form.control} name="installments" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº de Parcelas</FormLabel>
                  <FormControl><Input type="number" placeholder="Ex: 3" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="feePercentage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa (%)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="Ex: 4.99" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Regra"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcelas</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center">Carregando...</TableCell></TableRow>
              ) : (
                fees.map(fee => (
                  <TableRow key={fee.id}>
                    <TableCell>{fee.installments}x</TableCell>
                    <TableCell>{Number(fee.feePercentage).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(fee.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}