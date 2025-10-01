'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Eye } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ReactionDetailsModal } from "./components/reaction-details-modal";
import { ProductionStepClientBlock } from "./[id]/components/production-step-client-block";
import { AdjustPurityClientBlock } from "./[id]/components/adjust-purity-client-block";
import { ChemicalReactionDetails } from "@/services/chemicalReactionsApi";

// O tipo de dados que a tabela espera
export type Reaction = {
  id: string;
  status: 'STARTED' | 'PROCESSING' | 'PENDING_PURITY' | 'PENDING_PURITY_ADJUSTMENT' | 'COMPLETED' | 'CANCELED';
  auUsedGrams: number;
  createdAt: string;
  productionBatch: { id: string; batchNumber: string; product: { name: string } } | null;
  lots: { id: string; notes?: string; initialGrams: number; remainingGrams: number; }[]; // Adicionado
};

const statusVariantMap: { [key in Reaction['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  STARTED: 'secondary',
  PROCESSING: 'secondary',
  PENDING_PURITY: 'secondary',
  PENDING_PURITY_ADJUSTMENT: 'secondary',
  COMPLETED: 'default',
  CANCELED: 'destructive',
};

export default function ChemicalReactionsPage() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReaction, setSelectedReaction] = useState<ChemicalReactionDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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

  const handleOpenDetails = async (reactionId: string) => {
    try {
      const response = await api.get(`/chemical-reactions/${reactionId}`);
      setSelectedReaction(response.data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error("Falha ao buscar detalhes da reação.");
    }
  };

  const columns: ColumnDef<Reaction>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Reaction['status'];
        const displayStatus = status ? status.replace('_', ' ') : 'Desconhecido';
        const variant = status && statusVariantMap[status] ? statusVariantMap[status] : 'outline';
        return <Badge variant={variant}>{displayStatus}</Badge>;
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
              <DropdownMenuItem onClick={() => handleOpenDetails(reaction.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(reaction.status === 'STARTED' || reaction.status === 'PROCESSING') && (
                <ProductionStepClientBlock reactionId={reaction.id} auUsedGrams={reaction.auUsedGrams} />
              )}
              {reaction.status === 'PENDING_PURITY_ADJUSTMENT' && (
                <AdjustPurityClientBlock reactionId={reaction.id} />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <ReactionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        reaction={selectedReaction}
      />
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
    </>
  );
}
