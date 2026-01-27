'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SeparationDialog } from './components/separation-dialog';

export interface SaleInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
}

export interface PaymentTerm {
  id: string;
  name: string;
  installmentsDays: number[];
}

export interface Sale {
  id: string;
  orderNumber: string;
  pessoa: { name: string };
  totalAmount: number;
  feeAmount: number;
  netAmount: number;
  goldPrice: number;
  goldValue: number;
  paymentMethod: string;
  createdAt: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'A_SEPARAR' | 'SEPARADO' | 'FINALIZADO' | 'CANCELADO';
  lucro?: number;
  paymentAccountName?: string;
  adjustment?: {
    netDiscrepancyGrams: number;
    paymentReceivedBRL: number;
  };
  accountsRec: {
    id: string;
    amount: number;
    description: string;
    received: boolean;
  }[];
  saleItems: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: { name: string };
    inventoryLotId?: string;
    inventoryLot?: { batchNumber: string };
  }[];
  installments: SaleInstallment[]; // Added installments
  paymentTerm?: PaymentTerm; // Added paymentTerm
}

export default function PcpPickingPage() {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setIsPageLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const fetchOrdersToSeparate = async () => {
    setIsPageLoading(true);
    try {
      const response = await api.get('/sales?status=A_SEPARAR');
      setOrders(response.data);
    } catch (err) {
      toast.error('Falha ao buscar pedidos para separação.');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersToSeparate();
  }, []);

  const handleOpenDialog = (saleId: string) => {
    setSelectedSaleId(saleId);
    setIsDialogOpen(true);
  };

  const handleSeparationConfirmed = () => {
    fetchOrdersToSeparate(); // Re-fetch orders after confirmation
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (clientFilter) {
      filtered = filtered.filter(order =>
        order.pessoa.name.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    if (productFilter) {
      filtered = filtered.filter(order =>
        order.saleItems.some(item =>
          item.product.name.toLowerCase().includes(productFilter.toLowerCase())
        )
      );
    }

    return filtered;
  }, [orders, clientFilter, productFilter]);

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: 'orderNumber',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nº Pedido
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'pessoa.name',
      header: 'Cliente',
      cell: ({ row }) => row.original.pessoa.name,
    },
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
            <Button onClick={() => handleOpenDialog(row.original.id)}>Separar</Button>
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
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex gap-4">
          <Input
            placeholder="Filtrar por cliente..."
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          />
          <Input
            placeholder="Filtrar por produto..."
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredOrders}
            isLoading={loading}
            filterColumnId="pessoa.name"
          />
        </CardContent>
      </Card>

      <SeparationDialog
        saleId={selectedSaleId}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSeparationConfirmed={handleSeparationConfirmed}
      />
    </div>
  );
}
