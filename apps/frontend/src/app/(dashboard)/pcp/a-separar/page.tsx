'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Sale } from '@/app/(dashboard)/sales/page'; // Reuse Sale type

export default function PcpPickingPage() {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrdersToSeparate = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sales?status=A_SEPARAR');
      setOrders(response.data);
    } catch (err) {
      toast.error('Falha ao buscar pedidos para separação.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersToSeparate();
  }, []);

  const columns: ColumnDef<Sale>[] = [
    { accessorKey: 'orderNumber', header: 'Nº Pedido' },
    { accessorKey: 'pessoa.name', header: 'Cliente' },
    {
      header: 'Itens para Separar',
      cell: ({ row }) => {
        return (
          <ul>
            {row.original.saleItems.map(item => (
              <li key={item.id}>
                {item.quantity}x {item.product.name}
                {item.inventoryLot?.batchNumber && ` (Lote: ${item.inventoryLot.batchNumber})`}
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Button asChild>
              <Link href={`/pcp/a-separar/${row.original.id}`}>Separar</Link>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">PCP - Pedidos para Separação</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={orders}
            filterColumnId="orderNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}
