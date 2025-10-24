
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';

// --- Interfaces (can be moved to a types file later) ---
interface InventoryLot {
  id: string;
  remainingQuantity: number;
  sourceType: string;
  batchNumber?: string;
}
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  inventoryLots: InventoryLot[];
}
interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  stock: number;
  inventoryLotId?: string;
}

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  items: SaleItem[];
  onAddItem: (item: { productId: string; name: string; quantity: number; price: number; inventoryLotId?: string; batchNumber?: string; }) => void;
  saleGoldQuote: number;
  laborCostTable: any[];
}

const GOLD_SALT_PRODUCT_NAME = 'El Sal 68%';
const GOLD_SALT_CONVERSION_RATE = 1.47;

export function AddItemModal({
  open,
  onOpenChange,
  products,
  items,
  onAddItem,
  saleGoldQuote,
  laborCostTable,
}: AddItemModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [laborPercentInput, setLaborPercentInput] = useState<number | string>(0);
  const [entryUnit, setEntryUnit] = useState('sal');
  const [entryQuantity, setEntryQuantity] = useState<number | string>(1);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedProduct(null);
      setSelectedLot(null);
      setEntryQuantity(1);
      setEntryUnit('sal');
      setItemPrice(0);
      setLaborPercentInput(0);
    }
  }, [open]);

  const isGoldSaltProduct = useMemo(
    () => selectedProduct?.name.includes(GOLD_SALT_PRODUCT_NAME),
    [selectedProduct]
  );

  const goldAmount = useMemo(() => {
    if (!isGoldSaltProduct) return 0;
    const quant = typeof entryQuantity === 'string' ? parseFloat(entryQuantity) : entryQuantity;
    if (isNaN(quant)) return 0;
    return entryUnit === 'au' ? quant : quant / GOLD_SALT_CONVERSION_RATE;
  }, [entryQuantity, entryUnit, isGoldSaltProduct]);

  const laborGramsCharged = useMemo(() => {
    if (!isGoldSaltProduct || goldAmount <= 0) return 0;
    const entry = laborCostTable.find(
      (e) => goldAmount >= e.minGrams && (e.maxGrams === null || goldAmount <= e.maxGrams)
    );
    return entry ? entry.goldGramsCharged : 0;
  }, [goldAmount, isGoldSaltProduct, laborCostTable]);



  const totalGoldAmount = useMemo(() => {
    const laborPercent = typeof laborPercentInput === 'string' ? parseFloat(laborPercentInput) : (laborPercentInput || 0);
    const laborGrams = goldAmount * (laborPercent / 100);
    return goldAmount + laborGrams;
  }, [goldAmount, laborPercentInput]);

  const finalQuantity = useMemo(() => {
    const quant = typeof entryQuantity === 'string' ? parseFloat(entryQuantity) : entryQuantity;
    if (isNaN(quant)) return 0;
    if (isGoldSaltProduct) {
      return entryUnit === 'au' ? quant * GOLD_SALT_CONVERSION_RATE : quant;
    }
    return quant;
  }, [entryQuantity, entryUnit, isGoldSaltProduct]);

  const calculatedItemPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (isGoldSaltProduct) {
      if (!saleGoldQuote || saleGoldQuote <= 0) return 0;
      if (goldAmount <= 0) return 0;
      const totalBRL = totalGoldAmount * saleGoldQuote;
      if (finalQuantity === 0) return 0;
      return totalBRL / finalQuantity;
    } else {
      return Number(selectedProduct.price);
    }
  }, [selectedProduct, isGoldSaltProduct, saleGoldQuote, goldAmount, laborPercentInput, finalQuantity, totalGoldAmount]);

  useEffect(() => {
    if (selectedProduct && !isGoldSaltProduct) {
      setItemPrice(Number(selectedProduct.price));
    } else {
      setItemPrice(calculatedItemPrice);
    }
  }, [selectedProduct, isGoldSaltProduct, calculatedItemPrice]);


  const handleConfirmAddItem = () => {
    if (!selectedProduct || finalQuantity <= 0 || itemPrice <= 0) {
      toast.error('Selecione um produto, quantidade e preço válidos.');
      return;
    }

    const isManufactured = selectedProduct.inventoryLots.length > 0;
    if (isManufactured && !selectedLot) {
      toast.error('Para este produto, é obrigatório selecionar um lote.');
      return;
    }

    const lot = selectedProduct.inventoryLots.find((l) => l.id === selectedLot);
    const usedQuantity = items
      .filter((item) => item.inventoryLotId === selectedLot)
      .reduce((acc, item) => acc + Number(item.quantity), 0);

    const stockAvailable = isManufactured
      ? (lot?.remainingQuantity || 0) - usedQuantity
      : (selectedProduct.stock || 0) - usedQuantity;

    if (finalQuantity > stockAvailable) {
      toast.error(`Estoque insuficiente no lote. Disponível: ${stockAvailable.toFixed(4)}`);
      return;
    }

    onAddItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      quantity: finalQuantity,
      price: itemPrice,
      inventoryLotId: selectedLot || undefined,
      batchNumber: lot?.batchNumber,
    });

    onOpenChange(false); // Close modal on success
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Adicionar Produto à Venda</DialogTitle>
          <DialogDescription>
            Selecione o produto, lote e quantidades. O preço será calculado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end py-4">
          <div className="sm:col-span-12">
            <Label>Produto</Label>
            <Combobox
              options={products.map((p) => ({ value: p.id, label: p.name }))}
              value={selectedProduct?.id}
              onChange={(value) => {
                const product = products.find((p) => p.id === value) || null;
                setSelectedProduct(product);
                setEntryQuantity(1);
                setSelectedLot(null);
                if (product?.name.includes(GOLD_SALT_PRODUCT_NAME)) {
                  setEntryUnit('au');
                } else {
                  setEntryUnit('sal');
                }
              }}
              placeholder="Pesquise..."
            />
          </div>

          {isGoldSaltProduct ? (
            <>
              <div className="sm:col-span-3">
                <Label>Qtd. Lançada</Label>
                <Input
                  type="number"
                  value={entryQuantity}
                  onChange={(e) => setEntryQuantity(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Unidade</Label>
                <Select onValueChange={setEntryUnit} value={entryUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sal">g Sal</SelectItem>
                    <SelectItem value="au">g Au</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Mão de Obra (%)</Label>
                <Input
                  type="number"
                  value={laborPercentInput}
                  onChange={(e) => setLaborPercentInput(e.target.value)}
                  step="0.01"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Total Ouro (g)</Label>
                <Input type="number" value={totalGoldAmount.toFixed(4)} readOnly disabled className="font-bold" />
              </div>
              <div className="sm:col-span-3">
                <Label>Qtd. Final (Sal)</Label>
                <Input type="number" value={finalQuantity.toFixed(4)} readOnly disabled />
              </div>
            </>
          ) : (
            <>
              <div className="sm:col-span-6">
                <Label>Preço Unit.</Label>
                <Input type="number" value={itemPrice} onChange={(e) => setItemPrice(Number(e.target.value))} min="0" step="0.01" />
              </div>
              <div className="sm:col-span-6">
                <Label>Qtd.</Label>
                <Input type="number" value={entryQuantity} onChange={(e) => setEntryQuantity(e.target.value)} min="1" />
              </div>
            </>
          )}

          {selectedProduct && selectedProduct.inventoryLots.length > 0 && (
            <div className="sm:col-span-12">
              <Label>Lote de Produção</Label>
              <Select onValueChange={setSelectedLot} value={selectedLot || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lote..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct.inventoryLots
                    .map((lot) => {
                      const used = items
                        .filter((item) => item.inventoryLotId === lot.id)
                        .reduce((acc, item) => acc + Number(item.quantity), 0);
                      const available = lot.remainingQuantity - used;
                      return { ...lot, available };
                    })
                    .filter((lot) => lot.available > 0.0001)
                    .map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        Lote {lot.batchNumber || `#${lot.id.substring(0, 8)}`} (Disponível: {lot.available.toFixed(4)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirmAddItem}>
            Adicionar Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
