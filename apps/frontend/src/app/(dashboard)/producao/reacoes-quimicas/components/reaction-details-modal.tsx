'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { ChemicalReactionDetails } from "@/services/chemicalReactionsApi";
import { Separator } from "@/components/ui/separator";

const formatGrams = (grams: number) => new Intl.NumberFormat('pt-BR', { style: 'unit', unit: 'gram', minimumFractionDigits: 2 }).format(grams);
const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const statusVariantMap: { [key in ChemicalReactionDetails['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  STARTED: 'secondary',
  PROCESSING: 'secondary',
  PENDING_PURITY: 'secondary',
  PENDING_PURITY_ADJUSTMENT: 'secondary',
  COMPLETED: 'default',
  CANCELED: 'destructive',
};

interface ReactionDetailsModalProps {
  reaction: ChemicalReactionDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReactionDetailsModal({ reaction, isOpen, onClose }: ReactionDetailsModalProps) {
  if (!reaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Reação</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">ID: {reaction.id}</p>
            <Badge variant={statusVariantMap[reaction.status]} className="text-lg">{reaction.status.replace('_', ' ')}</Badge>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-2">Insumos</h3>
            <div className="grid gap-2">
              <p><strong>Ouro Utilizado:</strong> {formatGrams(reaction.auUsedGrams)}</p>
              {reaction.lots && reaction.lots.length > 0 ? (
                <div className="mt-2">
                  <p className="font-medium text-sm text-muted-foreground">Lotes de Metal (Insumo):</p>
                  <ul className="list-disc list-inside ml-4 text-sm">
                    {reaction.lots.map(lot => (
                      <li key={lot.id}>
                        Lote {lot.id.substring(0, 8)} ({lot.notes || '-'}) - {formatGrams(lot.initialGrams)} (Restante: {formatGrams(lot.remainingGrams)})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lote de metal utilizado como insumo.</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-2">Resultados</h3>
            <div className="grid gap-2">
              <p><strong>Lote Gerado:</strong> {reaction.productionBatch?.batchNumber}</p>
              <p><strong>Produto:</strong> {reaction.productionBatch?.product.name}</p>
              <p><strong>Quantidade Produzida:</strong> {formatGrams(reaction.outputProductGrams)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-2">Datas</h3>
            <div className="grid gap-2">
              <p><strong>Iniciada em:</strong> {formatDate(reaction.createdAt)}</p>
              <p><strong>Finalizada em:</strong> {reaction.status === 'COMPLETED' ? formatDate(reaction.updatedAt) : '-'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
