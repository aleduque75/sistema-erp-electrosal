import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import api from '@/lib/api';
import { getPureMetalLots } from '@/services/pureMetalLotsApi';
import { getChemicalReactionById } from '@/services/chemicalReactionsApi';
import { PureMetalLot } from '@/types/pure-metal-lot';
import {
  getLotSourceTypeInfo,
  getLotPartner,
  getLotDescription,
  getLotIdentifier,
} from '@/lib/pure-metal-lot-utils';

interface PureMetalLotSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chemicalReactionId: string;
  currentLotIds: string[];
  onSave: () => void;
}

export function PureMetalLotSelectionModal({
  isOpen,
  onClose,
  chemicalReactionId,
  currentLotIds,
  onSave,
}: PureMetalLotSelectionModalProps) {
  const [availableLots, setAvailableLots] = useState<PureMetalLot[]>([]);
  const [selectedLots, setSelectedLots] = useState<{ pureMetalLotId: string; gramsToUse: number }[]>([]);
  const [reactionDate, setReactionDate] = useState<string>("");
  const [loading, setIsPageLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchLotsAndReaction = async () => {
        setIsPageLoading(true);
        try {
          const lots = await getPureMetalLots();
          setAvailableLots(lots);
          const initialSelectedLots = currentLotIds.map(lotId => {
            const lot = lots.find(l => l.id === lotId);
            return { pureMetalLotId: lotId, gramsToUse: lot ? lot.remainingGrams || lot.initialGrams : 0 };
          });
          setSelectedLots(initialSelectedLots);

          const reaction = await getChemicalReactionById(chemicalReactionId);
          const rawDate = (reaction as any).reactionDate || reaction.createdAt;
          if (rawDate) {
            setReactionDate(new Date(rawDate).toISOString().split("T")[0]);
          }
        } catch (error) {
          toast.error("Falha ao carregar dados para edição.");
          console.error("Failed to fetch data for edit:", error);
        } finally {
          setIsPageLoading(false);
        }
      };
      fetchLotsAndReaction();
    }
  }, [isOpen, chemicalReactionId, currentLotIds]);

  const totalGrams = useMemo(() => {
    return selectedLots.reduce((total, lot) => total + lot.gramsToUse, 0);
  }, [selectedLots]);

  const handleCheckboxChange = (lotId: string, checked: boolean) => {
    if (checked) {
      const lot = availableLots.find((l) => l.id === lotId);
      setSelectedLots((prev) => [
        ...prev,
        { pureMetalLotId: lotId, gramsToUse: lot ? lot.remainingGrams || lot.initialGrams : 0 },
      ]);
    } else {
      setSelectedLots((prev) => prev.filter((l) => l.pureMetalLotId !== lotId));
    }
  };

  const handleQuantityChange = (lotId: string, grams: number) => {
    setSelectedLots((prev) =>
      prev.map((sl) => (sl.pureMetalLotId === lotId ? { ...sl, gramsToUse: grams } : sl))
    );
  };

  const handleSave = async () => {
    setIsPageLoading(true);
    try {
      await api.put(`/chemical-reactions/${chemicalReactionId}/lots`, {
        reactionDate,
        lots: selectedLots,
      });

      toast.success("Lotes de metal puro e data da reação atualizados com sucesso!");
      onSave();
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar a reação química.");
      console.error("Failed to update chemical reaction:", error);
    } finally {
      setIsPageLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Lotes de Metal Puro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="reaction-date" className="text-sm font-medium">Data da Reação</label>
            <Input 
              id="reaction-date" 
              type="date" 
              value={reactionDate} 
              onChange={(e) => setReactionDate(e.target.value)} 
              className="w-48"
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando lotes...</p>
          ) : (
            <ScrollArea className="h-[360px] w-full rounded-md border p-3">
              {availableLots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum lote de metal puro disponível.</p>
              ) : (
                <div className="space-y-2.5">
                  {availableLots.map((lot) => {
                    const isSelected = selectedLots.some(sl => sl.pureMetalLotId === lot.id);
                    const currentQuantity = selectedLots.find(sl => sl.pureMetalLotId === lot.id)?.gramsToUse || 0;
                    const typeInfo = getLotSourceTypeInfo(lot.sourceType);
                    const identifier = getLotIdentifier(lot);
                    const partner = getLotPartner(lot);
                    const description = getLotDescription(lot);

                    return (
                      <div
                        key={lot.id}
                        className={`p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                          isSelected ? "bg-muted/50 border-primary/40" : "bg-card/40 hover:bg-card"
                        }`}
                      >
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <Checkbox
                            id={lot.id}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(lot.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <label
                                htmlFor={lot.id}
                                className="text-sm font-semibold cursor-pointer"
                              >
                                {identifier}
                              </label>
                              <Badge variant={typeInfo.variant} className={`text-[10px] ${typeInfo.badgeClass || ""}`}>
                                {typeInfo.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                ({lot.metalType})
                              </span>
                            </div>

                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2">
                              {partner !== "-" && <span><strong>Origem:</strong> {partner}</span>}
                              {partner !== "-" && description !== "-" && <span>•</span>}
                              {description !== "-" && (
                                <span className="truncate max-w-[320px]" title={description}>
                                  {description}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Saldo: <span className="font-mono font-medium text-foreground">{lot.remainingGrams?.toFixed(3) || lot.initialGrams?.toFixed(3)}g</span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-muted-foreground">Usar:</span>
                            <Input
                              type="number"
                              step="0.001"
                              min="0.001"
                              max={lot.remainingGrams || lot.initialGrams}
                              value={currentQuantity || ""}
                              onChange={(e) => handleQuantityChange(lot.id, Number(e.target.value))}
                              className="w-24 h-8 text-right font-mono text-xs"
                            />
                            <span className="text-xs font-mono">g</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Total selecionado: <strong className="text-foreground font-mono">{totalGrams.toFixed(3)}g</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading || selectedLots.length === 0}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
