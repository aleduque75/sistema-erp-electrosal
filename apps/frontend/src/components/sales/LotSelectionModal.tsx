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
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      const response = await api.get(`/inventory-lots/product/${productId}`);
      const lots: InventoryLot[] = response.data;
      // Ordenar por FIFO (First-In, First-Out)
      lots.sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());
      setAvailableLots(lots);
    } catch (error) {
      toast.error('Falha ao buscar lotes disponíveis.');
      console.error(error);
    } finally {
      setIsLoading(false);
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

  const getTotalSelectedQuantity = () => {
    return Array.from(selectedLots.values()).reduce((sum, qty) => new Decimal(sum).plus(qty).toNumber(), 0);
  };

  const handleConfirm = () => {
    const totalSelected = getTotalSelectedQuantity();
    const required = new Decimal(quantityRequired);

    if (required.minus(totalSelected).abs().greaterThan('0.0001')) {
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Selecionar Lotes para: {product?.name}</DialogTitle>
          <DialogDescription>
            Selecione os lotes de inventário para suprir a quantidade necessária do item.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Quantidade Necessária</p>
              <p className="text-2xl font-bold">{quantityRequired}</p>
            </div>
            <div>
              <p className="font-medium">Quantidade Selecionada</p>
              <p className="text-2xl font-bold">{getTotalSelectedQuantity()}</p>
            </div>
            <div>
              <p className="font-medium">Quantidade Restante</p>
              <p className={`text-2xl font-bold ${quantityRemaining < 0 ? 'text-destructive' : 'text-success'}`}>
                {quantityRemaining.toFixed(4)}
              </p>
            </div>
          </div>

          {isLoading ? (
            <p>Carregando lotes...</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead>Data de Recebimento</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Qtd. Disponível</TableHead>
                    <TableHead className="w-[150px] text-right">Qtd. a Usar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableLots.map((lot) => {
                    const selectedQty = selectedLots.get(lot.id) || 0;
                    const remainingAfterSelection = new Decimal(lot.remainingQuantity).plus(existingLots.find(l => l.inventoryLotId === lot.id)?.quantity || 0);
                    
                    return (
                      <TableRow key={lot.id}>
                        <TableCell>{lot.batchNumber}</TableCell>
                        <TableCell>{format(new Date(lot.receivedDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lot.costPrice)}</TableCell>
                        <TableCell className="text-right">{remainingAfterSelection.toFixed(4)}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.0001"
                            value={selectedQty}
                            onChange={(e) => handleQuantityChange(lot.id, parseFloat(e.target.value) || 0)}
                            max={remainingAfterSelection.toNumber()}
                            min={0}
                            className="text-right"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Seleção</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
