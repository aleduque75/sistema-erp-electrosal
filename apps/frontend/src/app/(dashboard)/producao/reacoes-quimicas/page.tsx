// apps/frontend/src/app/(dashboard)/producao/reacoes-quimicas/page.tsx

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

// NOTA: ChemicalReactionDetails deve ser exportada do seu service file.
// Para fins de unificação e garantia de que o `selectedReaction` é do tipo correto:
import { ChemicalReactionDetails } from "@/types/chemical-reaction";


import { useRouter } from "next/navigation";

// O tipo de dados que a tabela espera agora é a interface COMPLETA que o modal exige.
// Isso resolve o erro de tipagem no `selectedReaction`.
// Removido o alias Reaction, use ChemicalReactionDetails diretamente

const statusVariantMap: { [key in ChemicalReactionDetails['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  STARTED: 'secondary',
  PROCESSING: 'secondary',
  PENDING_PURITY: 'secondary',
  PENDING_PURITY_ADJUSTMENT: 'secondary',
  COMPLETED: 'default',
  CANCELED: 'destructive',
};

export default function ChemicalReactionsPage() {
  const router = useRouter();
  const [reactions, setReactions] = useState<ChemicalReactionDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReaction, setSelectedReaction] = useState<ChemicalReactionDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Falha ao carregar detalhes da reação.");
      console.error("Failed to fetch reaction details:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReaction(null);
    fetchReactions(); // Refresh the list after closing the modal
  };

  const columns: ColumnDef<ChemicalReactionDetails>[] = [
    {
      accessorKey: 'reactionNumber',
      header: 'Nº Reação',
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.reactionNumber}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as ChemicalReactionDetails['status'];
        const displayStatus = status ? status.replace('_', ' ') : 'Desconhecido';
        const variant = status && statusVariantMap[status] ? statusVariantMap[status] : 'outline';
        return <Badge variant={variant}>{displayStatus}</Badge>;
      },
    },
    {
      accessorKey: 'auUsedGrams',
      header: () => <div className="text-right">Ouro Utilizado</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('auUsedGrams') as string);
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'unit', unit: 'gram' }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: 'productionBatch',
      header: 'Lote Gerado',
      cell: ({ row }) => {
        const batch = row.original.productionBatch; // Acessa diretamente o objeto
        return <div>{batch?.batchNumber || '-'}</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Data de Início',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt') as string);
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
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
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
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
      <ReactionDetailsModal
        reaction={selectedReaction}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}