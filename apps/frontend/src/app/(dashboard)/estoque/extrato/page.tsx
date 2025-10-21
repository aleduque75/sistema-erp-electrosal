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
  startDate: string;
  endDate: string;
  initialBalance: number;
  statement: StatementLine[];
  finalBalance: number;
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
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    setStatement(null);
    try {
      const response = await api.get('/stock-statement', {
        params: values,
      });
      setStatement(response.data);
    } catch (error) {
      toast.error('Falha ao gerar o extrato de estoque.');
    } finally {
      setIsLoading(false);
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
              <Button type="submit" disabled={isLoading} className="md:col-span-1">
                {isLoading ? 'Gerando...' : 'Gerar Extrato'}
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
            </div>
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
