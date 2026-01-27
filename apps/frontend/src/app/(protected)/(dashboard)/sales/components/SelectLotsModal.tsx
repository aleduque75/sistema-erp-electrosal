import { useState, useEffect, useMemo } from 'react'; // MODIFICADO
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  inventoryLots: {
    id: string;
    batchNumber: string;
    remainingQuantity: number;
  }[];
}

interface SelectLotsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  totalQuantityNeeded: number; // NOVO
  onAddItem: (item: any) => void;
}

export function SelectLotsModal({
  open,
  onOpenChange,
  product,
  totalQuantityNeeded, // NOVO
  onAddItem,
}: SelectLotsModalProps) {
  const [selectedLots, setSelectedLots] = useState<
    { inventoryLotId: string; batchNumber: string; quantity: number }[]
  >([]);

  const totalSelectedQuantity = useMemo(() => {
    return selectedLots.reduce((sum, lot) => sum + (lot.quantity || 0), 0);
  }, [selectedLots]);

  const remainingQuantity = useMemo(() => {
    return totalQuantityNeeded - totalSelectedQuantity;
  }, [totalQuantityNeeded, totalSelectedQuantity]);

  useEffect(() => {
    if (!open) {
      setSelectedLots([]);
    }
  }, [open]);

  if (!product) return null;

  const handleQuantityChange = (
    inventoryLotId: string,
    batchNumber: string,
    quantity: string
  ) => {
    const numQuantity = Number(quantity);
    setSelectedLots((prev) => {
      const existingLot = prev.find(
        (lot) => lot.inventoryLotId === inventoryLotId
      );
      if (existingLot) {
        return prev.map((lot) =>
          lot.inventoryLotId === inventoryLotId
            ? { ...lot, quantity: numQuantity }
            : lot
        );
      } else {
        return [
          ...prev,
          { inventoryLotId, batchNumber, quantity: numQuantity },
        ];
      }
    });
  };

  const handleSubmit = () => {
    if (Math.abs(totalSelectedQuantity - totalQuantityNeeded) > 0.0001) {
      toast.error(`A quantidade selecionada (${totalSelectedQuantity.toFixed(4)}) não corresponde à quantidade necessária (${totalQuantityNeeded.toFixed(4)}).`);
      return;
    }

    const lotsWithQuantity = selectedLots.filter((lot) => lot.quantity > 0);
    if (lotsWithQuantity.length === 0) {
      toast.error('Selecione pelo menos um lote e defina a quantidade.');
      return;
    }

    onAddItem({
      lots: lotsWithQuantity,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar Lotes para: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 text-center p-2 rounded-lg bg-muted">
          <div>
            <p className="text-sm font-medium">Total Necessário</p>
            <p className="text-lg font-bold">{totalQuantityNeeded.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Selecionado</p>
            <p className="text-lg font-bold">{totalSelectedQuantity.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Restante</p>
            <p className={`text-lg font-bold ${remainingQuantity < 0 ? 'text-destructive' : ''}`}>
              {remainingQuantity.toFixed(4)}
            </p>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Qtd. Disponível</TableHead>
                <TableHead>Qtd. a Usar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.inventoryLots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell>{lot.batchNumber}</TableCell>
                  <TableCell>{lot.remainingQuantity.toFixed(4)}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      max={lot.remainingQuantity}
                      value={selectedLots.find(l => l.inventoryLotId === lot.id)?.quantity || ''}
                      onChange={(e) =>
                        handleQuantityChange(
                          lot.id,
                          lot.batchNumber,
                          e.target.value
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const quantityToSet = Math.min(remainingQuantity, lot.remainingQuantity);
                        handleQuantityChange(lot.id, lot.batchNumber, String(quantityToSet));
                      }}
                      disabled={remainingQuantity <= 0}
                    >
                      Usar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Adicionar Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
