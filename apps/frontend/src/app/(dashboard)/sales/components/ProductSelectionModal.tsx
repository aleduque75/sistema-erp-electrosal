import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Product {
  id: string;
  name: string;
  price: number;
  inventoryLots: any[];
}

interface ProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
}

export function ProductSelectionModal({
  open,
  onOpenChange,
  products,
  onProductSelect,
}: ProductSelectionModalProps) {
  const handleSelect = (product: Product) => {
    onProductSelect(product);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Selecione um Produto</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleSelect(product)}
                      disabled={product.inventoryLots.length === 0}
                    >
                      {product.inventoryLots.length > 0 ? 'Selecionar Lotes' : 'Sem Lotes'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
