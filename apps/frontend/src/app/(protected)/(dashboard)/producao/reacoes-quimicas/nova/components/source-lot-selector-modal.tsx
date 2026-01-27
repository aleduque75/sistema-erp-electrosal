'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface PureMetalLot {
  id: string;
  sourceId: string;
  remainingGrams: number;
  purity: number;
}

interface SourceLotSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLots: PureMetalLot[];
  onAddLots: (lots: { pureMetalLotId: string; gramsToUse: number }[]) => void;
}

export function SourceLotSelectorModal({ isOpen, onClose, availableLots, onAddLots }: SourceLotSelectorModalProps) {
  const [selectedLots, setSelectedLots] = useState<{ [key: string]: { gramsToUse: number } }>({});

  const handleSelect = (lotId: string, isSelected: boolean) => {
    const lot = availableLots.find(l => l.id === lotId);
    if (!lot) return;

    const newSelectedLots = { ...selectedLots };
    if (isSelected) {
      newSelectedLots[lotId] = { gramsToUse: lot.remainingGrams };
    } else {
      delete newSelectedLots[lotId];
    }
    setSelectedLots(newSelectedLots);
  };

  const handleGramsChange = (lotId: string, grams: number) => {
    setSelectedLots(prev => ({
      ...prev,
      [lotId]: { ...prev[lotId], gramsToUse: grams },
    }));
  };

  const handleAdd = () => {
    const lotsToAdd = Object.entries(selectedLots).map(([lotId, { gramsToUse }]) => ({
      pureMetalLotId: lotId,
      gramsToUse: gramsToUse,
    }));
    onAddLots(lotsToAdd);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selecionar Lotes de Ouro de Origem</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Sel.</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className="text-right">Gramas Disponíveis</TableHead>
                <TableHead className="w-[150px] text-right">Gramas a Usar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableLots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell>
                    <Checkbox
                      checked={!!selectedLots[lot.id]}
                      onCheckedChange={(checked) => handleSelect(lot.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>{`Lote ${lot.sourceId} @ ${lot.purity * 100}%`}</TableCell>
                  <TableCell className="text-right">{lot.remainingGrams.toFixed(4)}g</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      disabled={!selectedLots[lot.id]}
                      value={selectedLots[lot.id]?.gramsToUse || ''}
                      onChange={(e) => handleGramsChange(lot.id, Number(e.target.value))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd}>Adicionar Lotes Selecionados</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
