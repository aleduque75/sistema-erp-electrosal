'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// O tipo de dados que a tabela espera
export type Reaction = {
  id: string;
  status: 'STARTED' | 'PROCESSING' | 'PENDING_PURITY' | 'FINALIZED' | 'CANCELED';
  auUsedGrams: number;
  createdAt: string;
  productionBatch: { id: string; batchNumber: string } | null;
};

const statusVariantMap: { [key in Reaction['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  STARTED: 'secondary',
  PROCESSING: 'secondary',
  PENDING_PURITY: 'secondary',
  FINALIZED: 'default',
  CANCELED: 'destructive',
};

export default function ChemicalReactionsPage() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Definição das colunas DENTRO do componente
  const columns: ColumnDef<Reaction>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Reaction['status'];
        return <Badge variant={statusVariantMap[status]}>{status.replace('_', ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'auUsedGrams',
      header: () => <div className="text-right">Ouro Utilizado</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('auUsedGrams'));
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'unit', unit: 'gram' }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: 'productionBatch',
      header: 'Lote Gerado',
      cell: ({ row }) => {
        const batch = row.getValue('productionBatch') as Reaction['productionBatch'];
        return <div>{batch?.batchNumber || '-'}</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Data de Início',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return <div>{date.toLocaleDateString('pt-BR')}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const reaction = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/producao/reacoes-quimicas/${reaction.id}`}>Ver detalhes</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const fetchReactions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/chemical-reactions");
      setReactions(response.data);
    } catch (err) {
      toast.error("Falha ao buscar reações químicas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReactions();
  }, []);

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reações Químicas</h1>
        <Link href="/producao/reacoes-quimicas/nova">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Reação
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Reações</CardTitle>
          <CardDescription>Acompanhe todas as reações químicas em andamento e finalizadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={reactions} 
            filterColumnId="productionBatch"
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}