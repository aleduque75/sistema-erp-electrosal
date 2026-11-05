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
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

import { TipoMetal } from "@/types/tipo-metal";
import { PureMetalLot } from "@/types/pure-metal-lot";
import {
  getLotSourceTypeInfo,
  getLotPartner,
  getLotDescription,
  getLotIdentifier,
} from "@/lib/pure-metal-lot-utils";

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

  const { data: metalLots, isLoading: isLoadingMetalLots } = useQuery<PureMetalLot[]>({
    queryKey: ["metalLots", metalType],
    queryFn: async () => {
      const response = await api.get(`/pure-metal-lots?remainingGramsGt=0&metalType=${metalType}`);
      return response.data;
    },
    enabled: !!metalType,
  });

  const filteredLots = useMemo(() => {
    if (!metalLots) return [];
    if (!searchTerm.trim()) return metalLots;

    const term = searchTerm.toLowerCase();
    return metalLots.filter((lot) => {
      const idMatch = lot.id.toLowerCase().includes(term);
      const lotNumberMatch = lot.lotNumber?.toLowerCase().includes(term);
      const descMatch = lot.description?.toLowerCase().includes(term);
      const notesMatch = lot.notes?.toLowerCase().includes(term);
      const rawTypeMatch = lot.sourceType?.toLowerCase().includes(term);
      const friendlyTypeMatch = getLotSourceTypeInfo(lot.sourceType).label.toLowerCase().includes(term);
      const partnerMatch = getLotPartner(lot).toLowerCase().includes(term);
      const orderMatch = (
        lot.originDetails?.orderNumber ||
        (lot.sale?.orderNumber ? String(lot.sale.orderNumber) : "")
      ).toLowerCase().includes(term);

      return (
        idMatch ||
        lotNumberMatch ||
        descMatch ||
        notesMatch ||
        rawTypeMatch ||
        friendlyTypeMatch ||
        partnerMatch ||
        orderMatch
      );
    });
  }, [metalLots, searchTerm]);

  useEffect(() => {
    const initialSelection = existingSelectedLotIds.map((lotId) => {
      const lot = metalLots?.find((ml) => ml.id === lotId);
      return {
        lotId,
        quantity: lot?.remainingGrams || 0,
      };
    });
    setSelectedLots(initialSelection);
  }, [existingSelectedLotIds, metalLots]);

  const handleToggleLot = (lot: PureMetalLot) => {
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

  const handleSetMaxQuantity = (lot: PureMetalLot) => {
    handleQuantityChange(lot.id, lot.remainingGrams);
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

  const totalSelectedGrams = useMemo(() => {
    return selectedLots.reduce((sum, sl) => sum + (sl.quantity || 0), 0);
  }, [selectedLots]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  };

  return (
    <DialogContent className="sm:max-w-[1100px] w-[95vw] max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="text-xl">Selecionar Lotes de Metal</DialogTitle>
        <DialogDescription>
          Selecione os lotes de metal que serão utilizados como insumo na reação.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2 space-y-3 flex-1 flex flex-col overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por lote, cliente, fornecedor, venda, tipo ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[420px] w-full rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[45px] text-center">Sel.</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="w-[120px]">Lote / ID</TableHead>
                <TableHead className="w-[160px]">Tipo de Origem</TableHead>
                <TableHead className="w-[170px]">Cliente / Fornecedor</TableHead>
                <TableHead>Histórico / Detalhes</TableHead>
                <TableHead className="text-right w-[110px]">Disponível</TableHead>
                <TableHead className="text-right w-[160px]">Qtd a Usar (g)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMetalLots ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando lotes de metal disponíveis...
                  </TableCell>
                </TableRow>
              ) : filteredLots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum lote encontrado com os critérios informados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLots.map((lot) => {
                  const isSelected = selectedLots.some((sl) => sl.lotId === lot.id);
                  const currentQuantity = selectedLots.find((sl) => sl.lotId === lot.id)?.quantity || 0;
                  const typeInfo = getLotSourceTypeInfo(lot.sourceType);
                  const partner = getLotPartner(lot);
                  const description = getLotDescription(lot);
                  const identifier = getLotIdentifier(lot);
                  const dateFormatted = formatDate(lot.entryDate || lot.createdAt);

                  return (
                    <TableRow
                      key={lot.id}
                      className={isSelected ? "bg-muted/40" : undefined}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleLot(lot)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {dateFormatted}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs whitespace-nowrap">
                          {identifier}
                        </div>
                        {lot.lotNumber && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            #{lot.id.substring(0, 8)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeInfo.variant}
                          className={`text-[11px] whitespace-nowrap ${typeInfo.badgeClass || ""}`}
                        >
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {partner !== "-" ? (
                          <span className="text-foreground">{partner}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px]">
                        <div className="line-clamp-2" title={description}>
                          {description}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-xs whitespace-nowrap">
                        {lot.remainingGrams.toFixed(3)}g
                      </TableCell>
                      <TableCell className="text-right">
                        {isSelected ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input
                              type="number"
                              step="0.001"
                              min="0.001"
                              max={lot.remainingGrams}
                              value={currentQuantity || ""}
                              onChange={(e) =>
                                handleQuantityChange(lot.id, Number(e.target.value))
                              }
                              className="h-8 text-xs text-right w-24 font-mono"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-1.5 text-[10px]"
                              onClick={() => handleSetMaxQuantity(lot)}
                              title="Usar quantidade total disponível"
                            >
                              Máx
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
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

      <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          {selectedLots.length > 0 ? (
            <span>
              <strong className="text-foreground">{selectedLots.length}</strong> lote(s) selecionado(s) | Total:{" "}
              <strong className="text-foreground font-mono">{totalSelectedGrams.toFixed(3)}g</strong>
            </span>
          ) : (
            <span>Nenhum lote selecionado</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmSelection} disabled={selectedLots.length === 0}>
            Confirmar Seleção ({selectedLots.length})
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
