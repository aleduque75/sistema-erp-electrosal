'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, subDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';

// --- Types ---
interface Product {
  id: string;
  name: string;
}

interface StatementLine {
  date: string;
  document: string;
  orderNumber: number | null;
  lot: string;
  quantity: number;
  balance: number;
}

interface StockStatement {
  productName: string;
  productId?: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  statement: StatementLine[];
  finalBalance: number;
  currentStock?: number;
}

const formSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto.'),
  startDate: z.string().min(1, 'Data inicial é obrigatória.'),
  endDate: z.string().min(1, 'Data final é obrigatória.'),
});

const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);

export default function StockStatementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [statement, setStatement] = useState<StockStatement | null>(null);
  const [loading, setIsPageLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: '',
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data));
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsPageLoading(true);
    setStatement(null);
    try {
      const response = await api.get('/stock-statement', {
        params: values,
      });
      setStatement(response.data);
    } catch (error) {
      toast.error('Falha ao gerar o extrato de estoque.');
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleReconcile = async () => {
    const currentProductId = form.getValues('productId');
    if (!currentProductId) return;
    setReconciling(true);
    try {
      await api.post('/stock/reconcile', { productId: currentProductId });
      toast.success('Extrato sincronizado com o estoque dos lotes com sucesso!');
      const response = await api.get('/stock-statement', {
        params: form.getValues(),
      });
      setStatement(response.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao sincronizar extrato com lotes.');
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold">Extrato de Estoque de Produto</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Produto</FormLabel>
                    <Combobox
                      options={products.map(p => ({ value: p.id, label: p.name }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione um produto..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inicial</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="md:col-span-1">
                {loading ? 'Gerando...' : 'Gerar Extrato'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {statement && (
        <Card>
          <CardHeader>
            <CardTitle>Extrato para: {statement.productName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Período</p>
                    <p className="font-semibold">{format(new Date(statement.startDate), 'dd/MM/yy')} a {format(new Date(statement.endDate), 'dd/MM/yy')}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Saldo Anterior</p>
                    <p className="font-semibold">{formatNumber(statement.initialBalance)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Saldo Final</p>
                    <p className="font-semibold">{formatNumber(statement.finalBalance)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Estoque Atual (Lotes)</p>
                    <p className="font-semibold">{formatNumber(statement.currentStock ?? statement.finalBalance)}</p>
                </div>
            </div>

            {statement.currentStock !== undefined && Math.abs(statement.finalBalance - statement.currentStock) > 0.01 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Divergência detectada entre o Extrato e o Saldo dos Lotes</p>
                    <p className="text-xs opacity-90">
                      Saldo do Extrato: <strong>{formatNumber(statement.finalBalance)}</strong> | Saldo dos Lotes: <strong>{formatNumber(statement.currentStock)}</strong> (Diferença: {formatNumber(statement.currentStock - statement.finalBalance)})
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/40 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0"
                  onClick={handleReconcile}
                  disabled={reconciling}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-1.5", reconciling && "animate-spin")} />
                  {reconciling ? "Sincronizando..." : "Sincronizar Extrato"}
                </Button>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Movimentação</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.statement.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(new Date(line.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{line.document}</TableCell>
                    <TableCell>{line.lot}</TableCell>
                    <TableCell className={cn(
                        "text-right font-mono",
                        line.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                        {line.quantity > 0 ? '+' : ''}{formatNumber(line.quantity)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(line.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
