// apps/frontend/src/app/(dashboard)/producao/reacoes-quimicas/page.tsx

'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Eye, Printer, X } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ReactionDetailsModal } from "./components/reaction-details-modal";
import { PureMetalLotSelectionModal } from "./components/PureMetalLotSelectionModal";
import { ProductionStepClientBlock } from "./[id]/components/production-step-client-block";
import { AdjustPurityClientBlock } from "./[id]/components/adjust-purity-client-block";
import { ChemicalReactionDetails } from "@/types/chemical-reaction";
import { TipoMetal } from "@/types/tipo-metal";

const statusVariantMap: { [key in ChemicalReactionDetails['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  STARTED: 'secondary',
  PROCESSING: 'secondary',
  PENDING_PURITY: 'secondary',
  PENDING_PURITY_ADJUSTMENT: 'secondary',
  COMPLETED: 'default',
  CANCELED: 'destructive',
};

const statusLabelMap: Record<string, string> = {
  STARTED: 'Iniciada',
  PROCESSING: 'Em Processamento',
  PENDING_PURITY: 'Aguardando Pureza',
  PENDING_PURITY_ADJUSTMENT: 'Aguardando Ajuste',
  COMPLETED: 'Finalizada',
  CANCELED: 'Cancelada',
};

export default function ChemicalReactionsPage() {
  const [reactions, setReactions] = useState<ChemicalReactionDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReaction, setSelectedReaction] = useState<ChemicalReactionDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLotSelectionModalOpen, setIsLotSelectionModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [metalTypeFilter, setMetalTypeFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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
    fetchReactions();
  };

  const handleOpenLotSelectionModal = (reaction: ChemicalReactionDetails) => {
    setSelectedReaction(reaction);
    setIsLotSelectionModalOpen(true);
  };

  const handlePrintPdf = async (reactionId: string) => {
    setIsPrinting(true);
    try {
      const response = await api.get(`/chemical-reactions/${reactionId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reacao-quimica-${reactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF gerado com sucesso.");
    } catch (error) {
      toast.error("Falha ao gerar o PDF.");
      console.error(error);
    } finally {
      setIsPrinting(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setMetalTypeFilter("ALL");
    setDateRange(undefined);
  };

  const filteredReactions = reactions.filter((reaction) => {
    const matchesStatus = statusFilter === "ALL" || reaction.status === statusFilter;
    const matchesMetalType = metalTypeFilter === "ALL" || reaction.metalType === metalTypeFilter;
    
    let matchesDate = true;
    if (dateRange?.from) {
      const reactionDate = new Date(reaction.reactionDate);
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      matchesDate = isWithinInterval(reactionDate, { start, end });
    }

    return matchesStatus && matchesMetalType && matchesDate;
  });

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
        const displayStatus = status ? (statusLabelMap[status] || status.replace('_', ' ')) : 'Desconhecido';
        const variant = status && statusVariantMap[status] ? statusVariantMap[status] : 'outline';
        return <Badge variant={variant}>{displayStatus}</Badge>;
      },
    },
    {
      accessorKey: 'metalType',
      header: 'Metal',
      cell: ({ row }) => {
        const metal = row.original.metalType;
        return <Badge variant="outline">{metal}</Badge>;
      },
    },
    {
      accessorKey: 'auUsedGrams',
      header: () => <div className="text-right">Metal Utilizado</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('auUsedGrams') as string);
        const metal = row.original.metalType;
        const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(amount);
        return <div className="text-right font-medium">{formatted} g {metal}</div>;
      },
    },
    {
      accessorKey: 'productionBatch',
      header: 'Lote Gerado',
      cell: ({ row }) => {
        const batch = row.original.productionBatch;
        return <div>{batch?.batchNumber || '-'}</div>;
      },
    },
    {
      accessorKey: 'reactionDate',
      header: 'Data de Início',
      cell: ({ row }) => {
        const date = new Date(row.getValue('reactionDate') as string);
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
              <DropdownMenuItem onClick={() => handlePrintPdf(reaction.id)} disabled={isPrinting}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Relatório
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {reaction.status === 'STARTED' && (
                <DropdownMenuItem onClick={() => handleOpenLotSelectionModal(reaction)}>
                  Editar Lotes
                </DropdownMenuItem>
              )}
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
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Período</label>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              </div>
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <label className="text-xs font-medium">Tipo de Metal</label>
                <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Metal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value={TipoMetal.AU}>Ouro (AU)</SelectItem>
                    <SelectItem value={TipoMetal.AG}>Prata (AG)</SelectItem>
                    <SelectItem value={TipoMetal.RH}>Ródio (RH)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[180px]">
                <label className="text-xs font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {Object.entries(statusLabelMap).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                {(metalTypeFilter !== "ALL" || statusFilter !== "ALL" || dateRange) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                    <X className="mr-2 h-4 w-4" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={filteredReactions} 
              filterColumnId="reactionNumber"
              filterPlaceholder="Pesquisar por número..."
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
      {selectedReaction && (
        <PureMetalLotSelectionModal
          isOpen={isLotSelectionModalOpen}
          onClose={() => setIsLotSelectionModalOpen(false)}
          chemicalReactionId={selectedReaction.id}
          currentLotIds={selectedReaction.lots?.map(lot => lot.id) ?? []}
          onSave={() => {
            fetchReactions();
            setIsLotSelectionModalOpen(false);
          }}
        />
      )}
    </>
  );
}