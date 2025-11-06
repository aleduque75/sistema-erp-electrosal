import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import api from '@/lib/api';
import { getPureMetalLots } from '@/services/pureMetalLotsApi';
import { getChemicalReactionById } from '@/services/chemicalReactionsApi';
import { PureMetalLot } from '@/types/pure-metal-lot';

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchLotsAndReaction = async () => {
        setIsLoading(true);
        try {
          const lots = await getPureMetalLots();
          console.log("Lots from API:", lots);
          setAvailableLots(lots);
          const initialSelectedLots = currentLotIds.map(lotId => {
            const lot = lots.find(l => l.id === lotId);
            return { pureMetalLotId: lotId, gramsToUse: lot ? lot.initialGrams : 0 };
          });
          setSelectedLots(initialSelectedLots);

          const reaction = await getChemicalReactionById(chemicalReactionId);
          setReactionDate(new Date(reaction.reactionDate).toISOString().split("T")[0]);
        } catch (error) {
          toast.error("Falha ao carregar dados para edição.");
          console.error("Failed to fetch data for edit:", error);
          console.error("Failed to fetch data for edit:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLotsAndReaction();
    }
  }, [isOpen, chemicalReactionId, currentLotIds]);

  const totalGrams = useMemo(() => {
    return selectedLots.reduce((total, lot) => total + lot.gramsToUse, 0);
  }, [selectedLots]);

  const handleSave = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecionar Lotes de Metal Puro</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="reaction-date">Data da Reação</label>
            <Input 
              id="reaction-date" 
              type="date" 
              value={reactionDate} 
              onChange={(e) => setReactionDate(e.target.value)} 
            />
          </div>
          {isLoading ? (
            <p>Carregando lotes...</p>
          ) : (
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {availableLots.length === 0 ? (
                <p>Nenhum lote de metal puro disponível.</p>
              ) : (
                <div className="space-y-2">
                  {availableLots.map((lot) => (
                    <div key={lot.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={lot.id}
                        checked={selectedLots.some(selectedLot => selectedLot.pureMetalLotId === lot.id)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(lot.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={lot.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {lot.lotNumber} - {lot.initialGrams}g ({lot.metalType}) - {lot.notes}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              Total: {totalGrams.toFixed(3)}g
            </span>
            <div>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
