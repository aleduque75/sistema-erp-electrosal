"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Pencil, Trash } from "lucide-react";
import { PureMetalLot, PureMetalLotStatus, TipoMetal } from "@/types/pure-metal-lot";
import { format } from 'date-fns';
import { toast } from "sonner";
import { getPureMetalLots, deletePureMetalLot } from "@/services/pureMetalLotsApi";
import { PureMetalLotDetailsModal } from "./PureMetalLotDetailsModal";
import { PureMetalLotEditModal } from "./PureMetalLotEditModal";
import { Badge } from "@/components/ui/badge";

export function PureMetalLotsTable() {
  const [pureMetalLots, setPureMetalLots] = useState<PureMetalLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<PureMetalLot | null>(null);

  const fetchPureMetalLots = async () => {
    setIsLoading(true);
    try {
      const data = await getPureMetalLots();
      setPureMetalLots(data);
    } catch (error) {
      toast.error("Erro ao carregar lotes de metal puro.");
      console.error("Erro ao buscar lotes de metal puro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPureMetalLots();
  }, []);

  const handleOpenDetailsModal = (lot: PureMetalLot) => {
    setSelectedLot(lot);
    setDetailsModalOpen(true);
  };

  const handleOpenEditModal = (lot: PureMetalLot) => {
    setSelectedLot(lot);
    setEditModalOpen(true);
  };

  const handleDeleteLot = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lote de metal puro?")) return;
    try {
      await deletePureMetalLot(id);
      toast.success("Lote de metal puro excluído com sucesso!");
      fetchPureMetalLots();
    } catch (error) {
      toast.error("Erro ao excluir lote de metal puro.");
      console.error("Erro ao excluir lote de metal puro:", error);
    }
  };

  const getStatusBadgeVariant = (status: PureMetalLotStatus) => {
    switch (status) {
      case PureMetalLotStatus.AVAILABLE:
        return "default";
      case PureMetalLotStatus.USED:
        return "destructive";
      case PureMetalLotStatus.PARTIALLY_USED:
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead>Tipo Metal</TableHead>
              <TableHead>Gramas Iniciais</TableHead>
              <TableHead>Gramas Restantes</TableHead>
              <TableHead>Pureza</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Entrada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (pureMetalLots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <img src="/images/gold-ingot.png" alt="Gold Ingot" className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Nenhum lote de metal puro encontrado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Quando novos lotes de metal puro forem adicionados, eles aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead>Tipo Metal</TableHead>
              <TableHead>Gramas Iniciais</TableHead>
              <TableHead>Gramas Restantes</TableHead>
              <TableHead>Pureza</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Entrada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pureMetalLots.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell className="font-medium">
                  {lot.sale?.pessoa?.name ? (
                    <span>{lot.sale.pessoa.name} (Pedido #{lot.sale.orderNumber})</span>
                  ) : lot.recoveryOrder?.orderNumber ? (
                    <span>Recuperação #{lot.recoveryOrder.orderNumber}</span>
                  ) : lot.chemical_reactions && lot.chemical_reactions.length > 0 ? (
                    <span>CRR #{lot.chemical_reactions[0].reactionNumber}</span>
                  ) : (
                    <span>{lot.sourceType} ({lot.sourceId.substring(0, 8)}...)</span>
                  )}
                </TableCell>
                <TableCell>{lot.metalType}</TableCell>
                <TableCell>{lot.initialGrams.toFixed(2)}</TableCell>
                <TableCell>{lot.remainingGrams.toFixed(2)}</TableCell>
                <TableCell>{lot.purity.toFixed(2)}%</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(lot.status)}>{lot.status}</Badge>
                </TableCell>
                <TableCell>{format(new Date(lot.entryDate), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenDetailsModal(lot)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEditModal(lot)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteLot(lot.id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLot && (
        <PureMetalLotDetailsModal
          isOpen={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          pureMetalLot={selectedLot}
        />
      )}

      {selectedLot && (
        <PureMetalLotEditModal
          isOpen={editModalOpen}
          onOpenChange={setEditModalOpen}
          pureMetalLot={selectedLot}
          onSuccess={fetchPureMetalLots}
        />
      )}
    </>
  );
}