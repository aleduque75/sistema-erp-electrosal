"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { TipoMetal } from "@/types/tipo-metal";

interface MetalLot {
  id: string;
  remainingGrams: number;
  sourceType: string;
  sourceId: string;
  description?: string;
  notes?: string;
  sale?: { // Adicionado
    pessoa: { // Adicionado
      name: string; // Adicionado
    };
  };
}

interface MetalLotSelectionModalProps {
  metalType: TipoMetal;
  onSelectLots: (selectedLots: { lotId: string; quantity: number }[]) => void;
  onClose: () => void;
  existingSelectedLotIds: string[];
}

export function MetalLotSelectionModal({
  metalType,
  onSelectLots,
  onClose,
  existingSelectedLotIds,
}: MetalLotSelectionModalProps) {
  const [selectedLots, setSelectedLots] = useState<{
    lotId: string;
    quantity: number;
  }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: metalLots, isLoading: isLoadingMetalLots } = useQuery<MetalLot[]>({
    queryKey: ["metalLots", metalType],
    queryFn: async () => {
      const response = await api.get(`/pure-metal-lots?remainingGramsGt=0&metalType=${metalType}`);
      console.log("Fetched pure_metal_lots:", response.data);
      return response.data;
    },
    enabled: !!metalType, // Only fetch if metalType is selected
  });

  const filteredLots = useMemo(() => {
    if (!metalLots) return [];
    const filtered = metalLots.filter(
      (lot) =>
        lot.id.includes(searchTerm) ||
        lot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.sourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lot.sourceType === 'SALE_PAYMENT' && lot.sale?.pessoa.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    console.log("Filtered pure_metal_lots:", filtered);
    return filtered;
  }, [metalLots, searchTerm]);

  useEffect(() => {
    // Initialize selectedLots with existing ones, if any
    const initialSelection = existingSelectedLotIds.map((lotId) => {
      const lot = metalLots?.find((ml) => ml.id === lotId);
      return {
        lotId,
        quantity: lot?.remainingGrams || 0, // Default to remaining, user can adjust later
      };
    });
    setSelectedLots(initialSelection);
  }, [existingSelectedLotIds, metalLots]);

  const handleToggleLot = (lot: MetalLot) => {
    setSelectedLots((prev) => {
      const isSelected = prev.some((sl) => sl.lotId === lot.id);
      if (isSelected) {
        return prev.filter((sl) => sl.lotId !== lot.id);
      }
      return [...prev, { lotId: lot.id, quantity: lot.remainingGrams }];
    });
  };

  const handleQuantityChange = (lotId: string, quantity: number) => {
    setSelectedLots((prev) =>
      prev.map((sl) => (sl.lotId === lotId ? { ...sl, quantity } : sl))
    );
  };

  const handleConfirmSelection = () => {
    const validSelections = selectedLots.filter((sl) => sl.quantity > 0);
    if (validSelections.length === 0) {
      toast.error("Selecione pelo menos um lote com quantidade maior que zero.");
      return;
    }
    onSelectLots(validSelections);
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[1000px]">
      <DialogHeader>
        <DialogTitle>Selecionar Lotes de Metal</DialogTitle>
        <DialogDescription>
          Selecione os lotes de metal que serão utilizados como insumo.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <Input
          placeholder="Buscar lotes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ScrollArea className="h-[300px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Selecionar</TableHead>
                <TableHead>ID do Lote</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead> {/* Nova coluna */}
                <TableHead className="text-right">Disponível (g)</TableHead>
                <TableHead className="text-right w-[150px]">Quantidade a Usar (g)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMetalLots ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Carregando lotes...
                  </TableCell>
                </TableRow>
              ) : filteredLots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Nenhum lote encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLots.map((lot) => {
                  const isSelected = selectedLots.some((sl) => sl.lotId === lot.id);
                  const currentQuantity = selectedLots.find((sl) => sl.lotId === lot.id)?.quantity || 0;
                  return (
                    <TableRow key={lot.id}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleLot(lot)}
                        />
                      </TableCell>
                      <TableCell>{lot.id.substring(0, 8)}</TableCell>
                      <TableCell>{lot.description || "-"}</TableCell>
                      <TableCell>{lot.sourceType}</TableCell>
                      <TableCell>{lot.sourceType === 'SALE_PAYMENT' ? lot.sale?.pessoa.name || '-' : '-'}</TableCell> {/* Exibe o cliente */}
                      <TableCell className="text-right">
                        {lot.remainingGrams.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isSelected ? (
                          <Input
                            type="number"
                            step="0.001"
                            min="0.001"
                            max={lot.remainingGrams}
                            value={currentQuantity}
                            onChange={(e) =>
                              handleQuantityChange(lot.id, Number(e.target.value))
                            }
                            onClick={(e) => e.stopPropagation()} // Prevent dialog from closing
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirmSelection}>Confirmar Seleção</Button>
      </DialogFooter>
    </DialogContent>
  );
}