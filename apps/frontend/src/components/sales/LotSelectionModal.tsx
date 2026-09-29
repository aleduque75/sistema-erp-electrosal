// apps/frontend/src/components/sales/LotSelectionModal.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Product } from '@/types/product';
import { InventoryLot } from '@/types/inventory-lot';
import { SaleItemLot } from '@/types/sale';
import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { Plus } from 'lucide-react';

interface LotSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  quantityRequired: number;
  onLotsSelected: (selectedLots: SaleItemLot[]) => void;
  existingLots: SaleItemLot[];
}

export function LotSelectionModal({
  isOpen,
  onClose,
  product,
  quantityRequired,
  onLotsSelected,
  existingLots,
}: LotSelectionModalProps) {
  const [availableLots, setAvailableLots] = useState<InventoryLot[]>([]);
  const [selectedLots, setSelectedLots] = useState<Map<string, number>>(new Map());
  const [loading, setIsPageLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      fetchAvailableLots(product.id);
      
      const initialSelectedLots = new Map<string, number>();
      existingLots.forEach(lot => {
        initialSelectedLots.set(lot.inventoryLotId, lot.quantity);
      });
      setSelectedLots(initialSelectedLots);
    }
  }, [isOpen, product, existingLots]);

  const fetchAvailableLots = async (productId: string) => {
    setIsPageLoading(true);
    try {
      const response = await api.get(`/products/${productId}`);
      const productData: Product = response.data;
      const lots: InventoryLot[] = productData.inventoryLots || [];
      // Ordenar por FIFO (First-In, First-Out)
      lots.sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());
      setAvailableLots(lots);
    } catch (error) {
      toast.error('Falha ao buscar lotes disponíveis.');
      console.error(error);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleQuantityChange = (lotId: string, quantity: number) => {
    const newSelectedLots = new Map(selectedLots);
    if (quantity > 0) {
      newSelectedLots.set(lotId, quantity);
    } else {
      newSelectedLots.delete(lotId);
    }
    setSelectedLots(newSelectedLots);
  };

  const handleAutoFill = (lotId: string, available: number) => {
    const currentTotal = getTotalSelectedQuantity();
    const currentForThisLot = selectedLots.get(lotId) || 0;
    const remainingNeeded = new Decimal(quantityRequired).minus(currentTotal).plus(currentForThisLot);
    
    if (remainingNeeded.lte(0) && currentForThisLot === 0) {
      toast.info('A quantidade necessária já foi atingida.');
      return;
    }

    const amountToFill = Decimal.min(remainingNeeded, available).toNumber();
    handleQuantityChange(lotId, amountToFill);
  };

  const getTotalSelectedQuantity = () => {
    return Array.from(selectedLots.values()).reduce((sum, qty) => new Decimal(sum).plus(qty).toNumber(), 0);
  };

  const handleConfirm = () => {
    const totalSelected = getTotalSelectedQuantity();
    const required = new Decimal(quantityRequired);

    if (required.minus(totalSelected).abs().greaterThan('0.01')) {
      toast.warning(`A quantidade selecionada (${totalSelected}) não corresponde à quantidade necessária (${quantityRequired}).`);
      return;
    }

    const result: SaleItemLot[] = Array.from(selectedLots.entries()).map(([inventoryLotId, quantity]) => ({
      inventoryLotId,
      quantity,
    }));

    onLotsSelected(result);
    onClose();
  };
  
  const quantityRemaining = new Decimal(quantityRequired).minus(getTotalSelectedQuantity()).toNumber();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6 z-[80] overflow-hidden">
        <DialogHeader className="shrink-0 pb-2 border-b">
          <DialogTitle className="text-base sm:text-lg">Selecionar Lotes para: {product?.name}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Selecione os lotes de inventário para suprir a quantidade necessária do item.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/40 rounded-lg text-center sm:text-left">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Necessária</p>
              <p className="text-lg sm:text-2xl font-bold">{quantityRequired}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Selecionada</p>
              <p className="text-lg sm:text-2xl font-bold">{getTotalSelectedQuantity()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Restante</p>
              <p className={`text-lg sm:text-2xl font-bold ${quantityRemaining < 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                {quantityRemaining.toFixed(2)}
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-6">Carregando lotes...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Lote</TableHead>
                    <TableHead className="text-xs">Data Recebimento</TableHead>
                    <TableHead className="text-right text-xs">Custo</TableHead>
                    <TableHead className="text-right text-xs">Disponível</TableHead>
                    <TableHead className="w-[120px] sm:w-[150px] text-right text-xs">Qtd. a Usar</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableLots.map((lot) => {
                    const selectedQty = selectedLots.get(lot.id) || 0;
                    const remainingAfterSelection = new Decimal(lot.remainingQuantity).plus(existingLots.find(l => l.inventoryLotId === lot.id)?.quantity || 0);
                    
                    return (
                      <TableRow key={lot.id}>
                        <TableCell className="text-xs font-medium">{lot.batchNumber}</TableCell>
                        <TableCell className="text-xs">{format(new Date(lot.receivedDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right text-xs">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lot.costPrice)}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{remainingAfterSelection.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            value={selectedQty}
                            onChange={(e) => handleQuantityChange(lot.id, parseFloat(e.target.value) || 0)}
                            max={remainingAfterSelection.toNumber()}
                            min={0}
                            className="text-right h-8 text-xs font-medium"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAutoFill(lot.id, remainingAfterSelection.toNumber())}
                            title="Preencher automaticamente"
                            className="h-8 w-8 text-primary"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="mt-3 pt-3 border-t flex flex-row justify-end gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 text-xs">Cancelar</Button>
          <Button type="button" size="sm" onClick={handleConfirm} className="h-9 text-xs font-semibold">Confirmar Seleção</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
