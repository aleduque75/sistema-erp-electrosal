import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PureMetalLot } from '@/types/pure-metal-lot';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface PureMetalLotDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pureMetalLot: PureMetalLot;
}

export function PureMetalLotDetailsModal({
  isOpen,
  onOpenChange,
  pureMetalLot,
}: PureMetalLotDetailsModalProps) {
  const getStatusBadgeVariant = (status: PureMetalLot['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'default';
      case 'USED':
        return 'destructive';
      case 'PARTIALLY_USED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Lote de Metal Puro</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o lote de metal puro selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">ID:</span>
            <span className="col-span-3 text-sm">{pureMetalLot.id}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Tipo de Metal:</span>
            <span className="col-span-3 text-sm">{pureMetalLot.metalType}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Gramas Iniciais:</span>
            <span className="col-span-3 text-sm">{pureMetalLot.initialGrams.toFixed(2)}g</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Gramas Restantes:</span>
            <span className="col-span-3 text-sm">{pureMetalLot.remainingGrams.toFixed(2)}g</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Pureza:</span>
            <span className="col-span-3 text-sm">{pureMetalLot.purity.toFixed(2)}%</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Status:</span>
            <span className="col-span-3 text-sm">
              <Badge variant={getStatusBadgeVariant(pureMetalLot.status)}>{pureMetalLot.status}</Badge>
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Data de Entrada:</span>
            <span className="col-span-3 text-sm">{format(new Date(pureMetalLot.entryDate), 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Origem:</span>
            <span className="col-span-3 text-sm">{pureMetalLot.sourceType} (ID: {pureMetalLot.sourceId})</span>
          </div>
          {pureMetalLot.saleId && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">ID da Venda:</span>
              <span className="col-span-3 text-sm">{pureMetalLot.saleId}</span>
            </div>
          )}

          {pureMetalLot.sale && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Associado à Venda:</span>
              <span className="col-span-3 text-sm">
                Pedido #{pureMetalLot.sale.orderNumber} (Total: R$ {pureMetalLot.sale.totalAmount?.toFixed(2) || 'N/A'})
              </span>
            </div>
          )}

          {pureMetalLot.chemical_reactions && pureMetalLot.chemical_reactions.length > 0 && (
            <div className="grid grid-cols-4 items-start gap-4">
              <span className="text-sm font-medium">Associado à Reação(ões):</span>
              <div className="col-span-3 text-sm flex flex-col space-y-1">
                {pureMetalLot.chemical_reactions.map((reaction) => (
                  <span key={reaction.id}>
                    Reação #{reaction.reactionNumber} ({reaction.outputProductGrams.toFixed(2)}g)
                  </span>
                ))}
              </div>
            </div>
          )}
          {pureMetalLot.notes && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Notas:</span>
              <span className="col-span-3 text-sm">{pureMetalLot.notes}</span>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Criado em:</span>
            <span className="col-span-3 text-sm">{format(new Date(pureMetalLot.createdAt), 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium">Atualizado em:</span>
            <span className="col-span-3 text-sm">{format(new Date(pureMetalLot.updatedAt), 'dd/MM/yyyy HH:mm')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}