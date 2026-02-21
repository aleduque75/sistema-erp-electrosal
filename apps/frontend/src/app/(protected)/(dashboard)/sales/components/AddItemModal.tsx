
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
import { InventoryLot, Product, SaleItem } from '@/types/sale';


interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  items: SaleItem[];
  onAddItem: (item: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    inventoryLotId?: string;
    batchNumber?: string;
    laborPercentage?: number;
    entryUnit?: string;
    entryQuantity?: number;
  }) => void;
  saleGoldQuote: number;
  saleSilverQuote: number;
  laborCostTable: any[];
}

const CONVERSION_PRODUCTS = [
  { name: 'El Sal 68%', metal: 'AU', factor: 0.68, laborDefault: 5, unitName: 'Sal' },
  { name: 'Cianeto de Prata 54%', metal: 'AG', factor: 0.54, laborDefault: 0, unitName: 'Cianeto' },
];

export function AddItemModal({
  open,
  onOpenChange,
  products,
  items,
  onAddItem,
  saleGoldQuote,
  saleSilverQuote,
  laborCostTable,
}: AddItemModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [laborPercentInput, setLaborPercentInput] = useState<number | string>(0);
  const [entryUnit, setEntryUnit] = useState('product');
  const [entryQuantity, setEntryQuantity] = useState<number | string>(1);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedProduct(null);
      setSelectedLot(null);
      setEntryQuantity(1);
      setEntryUnit('product');
      setItemPrice(0);
      setLaborPercentInput(0);
    }
  }, [open]);

  const specialConfig = useMemo(
    () => CONVERSION_PRODUCTS.find(cp => selectedProduct?.name.includes(cp.name)),
    [selectedProduct]
  );

  const metalAmount = useMemo(() => {
    if (!specialConfig) return 0;
    const quant = typeof entryQuantity === 'string' ? parseFloat(entryQuantity) : entryQuantity;
    if (isNaN(quant)) return 0;
    // Se a unidade for o metal (AU/AG), retorna a quantidade digitada
    if (entryUnit === 'metal') return quant;
    // Se a unidade for o produto final (Sal/Cianeto), converte para metal
    return quant * specialConfig.factor;
  }, [entryQuantity, entryUnit, specialConfig]);

  const totalMetalAmount = useMemo(() => {
    const laborPercent = typeof laborPercentInput === 'string' ? parseFloat(laborPercentInput) : (laborPercentInput || 0);
    const laborGrams = metalAmount * (laborPercent / 100);
    return metalAmount + laborGrams;
  }, [metalAmount, laborPercentInput]);

  const finalQuantity = useMemo(() => {
    const quant = typeof entryQuantity === 'string' ? parseFloat(entryQuantity) : entryQuantity;
    if (isNaN(quant)) return 0;
    if (specialConfig) {
      // Se a unidade for o metal, converte para a quantidade do produto final
      if (entryUnit === 'metal') return quant / specialConfig.factor;
      return quant;
    }
    return quant;
  }, [entryQuantity, entryUnit, specialConfig]);

  const calculatedItemPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (specialConfig) {
      const quote = specialConfig.metal === 'AU' ? saleGoldQuote : saleSilverQuote;
      if (!quote || quote <= 0) return 0;
      if (metalAmount <= 0) return 0;
      const totalBRL = totalMetalAmount * quote;
      if (finalQuantity === 0) return 0;
      return totalBRL / finalQuantity;
    } else {
      return Number(selectedProduct.price);
    }
  }, [selectedProduct, specialConfig, saleGoldQuote, saleSilverQuote, metalAmount, totalMetalAmount, finalQuantity]);

  useEffect(() => {
    if (selectedProduct && !specialConfig) {
      setItemPrice(Number(selectedProduct.price));
    } else {
      setItemPrice(calculatedItemPrice);
    }
  }, [selectedProduct, specialConfig, calculatedItemPrice]);


  const handleConfirmAddItem = () => {
    if (!selectedProduct || finalQuantity <= 0 || itemPrice <= 0) {
      toast.error('Selecione um produto, quantidade e preço válidos.');
      return;
    }

    const isManufactured = selectedProduct.inventoryLots.length > 0;

    // Calculate total available stock across all lots for this product
    const totalStockAvailable = isManufactured
      ? selectedProduct.inventoryLots.reduce((sum, lot) => {
        const usedInCurrentSale = items
          .filter((item) => item.inventoryLotId === lot.id)
          .reduce((acc, item) => acc + Number(item.quantity), 0);
        return sum + (lot.remainingQuantity - usedInCurrentSale);
      }, 0)
      : (selectedProduct.stock || 0);

    if (finalQuantity > totalStockAvailable + 0.01) {
      toast.error(`Estoque insuficiente. Total disponível: ${totalStockAvailable.toFixed(2)}`);
      return;
    }

    const lotIdToUse = selectedLot === 'none' ? undefined : selectedLot;
    const lot = lotIdToUse ? selectedProduct.inventoryLots.find((l) => l.id === lotIdToUse) : null;

    onAddItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      quantity: finalQuantity,
      price: itemPrice,
      inventoryLotId: lotIdToUse || undefined,
      batchNumber: lot?.batchNumber,
      laborPercentage: specialConfig ? (typeof laborPercentInput === 'string' ? parseFloat(laborPercentInput) : laborPercentInput) : undefined,
      entryUnit: specialConfig ? entryUnit : undefined,
      entryQuantity: specialConfig ? (typeof entryQuantity === 'string' ? parseFloat(entryQuantity) : entryQuantity) : undefined,
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
                if (product?.name.includes('El Sal 68%')) {
                  setEntryUnit('metal');
                  setLaborPercentInput(5);
                } else if (product?.name.includes('Cianeto de Prata 54%')) {
                  setEntryUnit('metal');
                  setLaborPercentInput(5);
                } else {
                  setEntryUnit('product');
                  setLaborPercentInput(0);
                }
              }}
              placeholder="Pesquise..."
            />
          </div>

          {specialConfig ? (
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
                    <SelectItem value="product">g {specialConfig.unitName}</SelectItem>
                    <SelectItem value="metal">g {specialConfig.metal}</SelectItem>
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
                <Label>Total {specialConfig.metal} (g)</Label>
                <Input type="number" value={totalMetalAmount.toFixed(2)} readOnly disabled className="font-bold" />
              </div>
              <div className="sm:col-span-3">
                <Label>Qtd. Final ({specialConfig.unitName})</Label>
                <Input type="number" value={finalQuantity.toFixed(2)} readOnly disabled />
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
                <Input type="number" value={entryQuantity} onChange={(e) => setEntryQuantity(e.target.value)} min="0.01" step="0.01" />
              </div>
            </>
          )}

          {selectedProduct && selectedProduct.inventoryLots.length > 0 && (
            <div className="sm:col-span-12">
              <Label>Lote de Produção (Opcional)</Label>
              <Select onValueChange={setSelectedLot} value={selectedLot || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Automático (FIFO) - Recomendado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Automático (FIFO)</SelectItem>
                  {selectedProduct.inventoryLots
                    .map((lot) => {
                      const used = items
                        .filter((item) => item.inventoryLotId === lot.id)
                        .reduce((acc, item) => acc + Number(item.quantity), 0);
                      const available = lot.remainingQuantity - used;
                      return { ...lot, available };
                    })
                    .filter((lot) => lot.available > 0.01)
                    .map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        Lote {lot.batchNumber || `#${lot.id.substring(0, 8)}`} (Disponível: {lot.available.toFixed(2)})
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
