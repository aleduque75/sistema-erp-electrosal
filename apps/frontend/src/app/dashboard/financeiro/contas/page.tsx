'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Tipagem para a Conta Corrente (deve espelhar o backend)
interface ContaCorrente {
  id: string;
  nome: string;
  numeroConta: string;
  agencia: string;
  initialBalanceBRL: number;
  initialBalanceGold: number;
}

// Schema de validação para o formulário de edição
const formSchema = z.object({
  initialBalanceBRL: z.coerce.number().optional(),
  initialBalanceGold: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContasPage() {
  const [contas, setContas] = useState<ContaCorrente[]>([]);
  const [selectedConta, setSelectedConta] = useState<ContaCorrente | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialBalanceBRL: 0,
      initialBalanceGold: 0,
    },
  });

  // Efeito para buscar os dados da API quando o componente montar
  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('contas-correntes');
      setContas(response.data);
    } catch (error) {
      toast.error('Erro ao buscar contas correntes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir o modal de edição
  const handleEditClick = (conta: ContaCorrente) => {
    setSelectedConta(conta);
    form.reset({
      initialBalanceBRL: Number(conta.initialBalanceBRL),
      initialBalanceGold: Number(conta.initialBalanceGold),
    });
    setIsDialogOpen(true);
  };

  // Fechar o modal
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedConta(null);
  };

  // Submeter o formulário de edição
  const onSubmit = async (values: FormValues) => {
    if (!selectedConta) return;

    const promise = api.patch(`contas-correntes/${selectedConta.id}`, values);

    toast.promise(promise, {
      loading: 'Salvando alterações...',
      success: () => {
        fetchContas(); // Recarrega os dados
        handleDialogClose();
        return 'Saldos atualizados com sucesso!';
      },
      error: 'Erro ao salvar alterações.',
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestão de Contas Correntes</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Contas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead className="text-right">Saldo Inicial (R$)</TableHead>
                  <TableHead className="text-right">Saldo Inicial (Au)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell>{conta.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{conta.numeroConta}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(conta.initialBalanceBRL))}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(conta.initialBalanceGold).toFixed(4)} g
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(conta)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Saldos Iniciais</DialogTitle>
            <DialogDescription>
              Ajuste os saldos iniciais para a conta: <strong>{selectedConta?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="initialBalanceBRL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Inicial (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialBalanceGold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Inicial (Au)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
