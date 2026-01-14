'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';

import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';

interface MetalReceivable {
  id: string;
  sale: { orderNumber: string };
  pessoa: { name: string };
  metalType: string;
  grams: number;
  dueDate: string;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const statusConfig: { [key in MetalReceivable['status']]: { label: string; className: string } } = {
  PENDENTE: { label: 'Pendente', className: 'text-yellow-600 bg-yellow-100' },
  PAGO: { label: 'Pago', className: 'text-green-600 bg-green-100' },
  CANCELADO: { label: 'Cancelado', className: 'text-red-600 bg-red-100' },
};

export default function MetalReceivablesPage() {
  const [allReceivables, setAllReceivables] = useState<MetalReceivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDENTE');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const fetchReceivables = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'TODOS') {
          params.append('status', statusFilter);
        }
        const response = await api.get(`/metal-receivables?${params.toString()}`);
        setAllReceivables(response.data);
      } catch (err) {
        toast.error('Falha ao buscar recebimentos de metal.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceivables();
  }, [statusFilter]);

  const filteredReceivables = useMemo(() => {
    return allReceivables.filter(r => {
      const searchTerm = filter.toLowerCase();
      const matchesText = searchTerm === '' ||
        r.pessoa.name.toLowerCase().includes(searchTerm) ||
        String(r.sale.orderNumber).toLowerCase().includes(searchTerm);

      const matchesDate = !dateRange || !dateRange.from || (
        new Date(r.dueDate) >= dateRange.from &&
        (!dateRange.to || new Date(r.dueDate) <= dateRange.to)
      );

      return matchesText && matchesDate;
    });
  }, [allReceivables, filter, dateRange]);

  const handleConfirmReceipt = async (id: string) => {
    if (!confirm('Você confirma o recebimento deste metal? Esta ação dará entrada do valor no estoque de metal puro.')) return;

    try {
      await api.patch(`/metal-receivables/${id}/receive`);
      toast.success('Recebimento de metal confirmado com sucesso!');
      // Re-trigger the fetch by changing the status filter and then setting it back
      const currentFilter = statusFilter;
      setStatusFilter('REFETCH'); // Use a unique value to force re-render
      setTimeout(() => setStatusFilter(currentFilter), 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Falha ao confirmar recebimento.');
    }
  };

  const columns: ColumnDef<MetalReceivable>[] = [
    { 
      accessorKey: 'sale.orderNumber', 
      header: 'Venda Nº',
      cell: ({ row }) => row.original.sale.orderNumber 
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return <Badge variant="outline" className={`border-none ${config.className}`}>{config.label}</Badge>;
      },
    },
    { 
      accessorKey: 'pessoa.name', 
      header: 'Cliente',
      cell: ({ row }) => row.original.pessoa.name
    },
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    { 
      accessorKey: 'metalType', 
      header: 'Metal' 
    },
    {
      accessorKey: 'grams',
      header: () => <div className="text-right">Gramas</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {Number(row.original.grams).toFixed(4)} g
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.status === 'PENDENTE' && (
            <Button onClick={() => handleConfirmReceipt(row.original.id)}>Confirmar Recebimento</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recebimentos de Metal</h1>
      </div>

      <div className="flex items-center gap-4">
        <Input 
          placeholder="Filtrar por cliente ou pedido..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="PAGO">Pago</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredReceivables}
            filterColumnId="sale.orderNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}